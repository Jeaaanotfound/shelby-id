import { Aptos, AptosConfig, AccountAddress } from '@aptos-labs/ts-sdk'
import type { WalletContextState } from '@aptos-labs/wallet-adapter-react'
import {
  createDefaultErasureCodingProvider,
  expectedTotalChunksets,
  generateCommitments,
  ShelbyBlobClient,
  SHELBYUSD_FA_METADATA_ADDRESS,
} from '@shelby-protocol/sdk/browser'
import { getAptosApiKey, getNetworkConfig, normalizeAddress, type AppNetworkKey } from './aptos'
import { getShelbyApiKey, getShelbyRpcBase } from './shelby'

type WalletSignTransactionFn = WalletContextState['signTransaction'] | null | undefined

interface UploadShelbyBlobsWithWalletParams {
  walletAddress: string
  signTransaction: WalletSignTransactionFn
  blobs: {
    blobName: string
    blobData: Uint8Array
  }[]
  expirationMicros: number
  networkKey: AppNetworkKey
  onProgress?: (update: UploadProgressUpdate) => void
}

interface UploadShelbyBlobsWithWalletResult {
  registrationStatus: 'registered' | 'existing'
  transactionHash?: string
}

export interface UploadProgressUpdate {
  blobName: string
  progress: number
  stage: 'awaiting_wallet' | 'registering' | 'uploading' | 'finalizing' | 'verifying' | 'done'
  detail?: string
}

const RPC_UPLOAD_RETRY_COUNT = 5
const INDEXER_SETTLE_DELAY_MS = 1_500
const MULTIPART_PART_SIZE_BYTES = 1_048_576
const DIRECT_UPLOAD_MAX_BYTES = 5 * 1024 * 1024
const MULTIPART_SESSION_RETRY_COUNT = 2

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function getBlobConfirmRetryCount() {
  return 4
}

function createAptosClient(networkKey: AppNetworkKey) {
  const networkConfig = getNetworkConfig(networkKey)
  const apiKey = getAptosApiKey()

  return new Aptos(
    new AptosConfig({
      network: networkConfig.aptosNetwork,
      fullnode: networkConfig.aptosApiBase,
      ...(apiKey ? { clientConfig: { API_KEY: apiKey } } : {}),
    })
  )
}

async function assertShelbyNetFunding(aptos: Aptos, account: string, needsGas: boolean) {
  let aptBalance: number
  let shelbyUsdBalance: number

  try {
    ;[aptBalance, shelbyUsdBalance] = await Promise.all([
      aptos.getAccountAPTAmount({ accountAddress: account }),
      aptos.getAccountCoinAmount({
        accountAddress: account,
        faMetadataAddress: SHELBYUSD_FA_METADATA_ADDRESS,
      }),
    ])
  } catch {
    throw new Error('Unable to check ShelbyNet funding. Try again, then confirm the wallet has APT and ShelbyUSD.')
  }

  if (needsGas && aptBalance <= 0) {
    throw new Error('This wallet has no APT on ShelbyNet. Fund it with APT before approving the transaction.')
  }

  if (shelbyUsdBalance <= 0) {
    throw new Error('This wallet has no ShelbyUSD on ShelbyNet. Fund it with ShelbyUSD before uploading a blob.')
  }
}

async function readErrorBody(response: Response) {
  return response.text().catch(() => '')
}

function encodeBlobPath(blobName: string) {
  return encodeURIComponent(blobName).replace(/%2F/g, '/')
}

function getShelbyAuthHeaders(networkKey: AppNetworkKey) {
  const apiKey = getShelbyApiKey(networkKey)
  const headers: HeadersInit = {}
  if (apiKey) {
    ;(headers as Record<string, string>).Authorization = `Bearer ${apiKey}`
  }
  return headers
}

function reportProgress(
  onProgress: UploadShelbyBlobsWithWalletParams['onProgress'],
  blobName: string,
  progress: UploadProgressUpdate['progress'],
  stage: UploadProgressUpdate['stage'],
  detail?: string
) {
  onProgress?.({
    blobName,
    progress,
    stage,
    detail,
  })
}

async function startMultipartUpload(networkKey: AppNetworkKey, account: string, blobName: string, partSize: number) {
  const response = await fetch(`${getShelbyRpcBase(networkKey)}/v1/multipart-uploads`, {
    method: 'POST',
    headers: {
      ...getShelbyAuthHeaders(networkKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rawAccount: account,
      rawBlobName: blobName,
      rawPartSize: partSize,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to start multipart upload! status: ${response.status}, body: ${await readErrorBody(response)}`)
  }

  const body = (await response.json()) as { uploadId?: string }
  if (!body.uploadId) {
    throw new Error('Failed to start multipart upload! uploadId missing from response.')
  }

  return body.uploadId
}

async function uploadMultipartPart(networkKey: AppNetworkKey, uploadId: string, partIdx: number, partData: Uint8Array) {
  let lastError: unknown

  for (let attempt = 0; attempt < RPC_UPLOAD_RETRY_COUNT; attempt++) {
    try {
      const response = await fetch(`${getShelbyRpcBase(networkKey)}/v1/multipart-uploads/${uploadId}/parts/${partIdx}`, {
        method: 'PUT',
        headers: {
          ...getShelbyAuthHeaders(networkKey),
          'Content-Type': 'application/octet-stream',
        },
        body: new Blob([partData.slice().buffer as ArrayBuffer], { type: 'application/octet-stream' }),
      })

      if (response.ok) {
        return
      }

      const errorBody = await readErrorBody(response)
      lastError = new Error(`Failed to upload part ${partIdx}! status: ${response.status}, body: ${errorBody}`)
    } catch (error) {
      lastError = error
    }

    if (attempt < RPC_UPLOAD_RETRY_COUNT - 1) {
      await sleep(300 * (attempt + 1))
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function completeMultipartUpload(networkKey: AppNetworkKey, uploadId: string) {
  try {
    const response = await fetch(`${getShelbyRpcBase(networkKey)}/v1/multipart-uploads/${uploadId}/complete`, {
      method: 'POST',
      headers: {
        ...getShelbyAuthHeaders(networkKey),
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      return
    }

    const errorBody = await readErrorBody(response)
    throw new Error(`Failed to complete multipart upload! status: ${response.status}, body: ${errorBody}`)
  } catch (error) {
    throw error
  }
}

interface ShelbyIndexerBlobRow {
  object_name?: string | null
  is_committed?: boolean | number | string | null
  is_deleted?: boolean | number | string | null
  is_persisted?: boolean | number | string | null
}

interface ShelbyIndexerResponse {
  data?: {
    blobs?: ShelbyIndexerBlobRow[]
  }
  errors?: { message?: string }[]
}

function isShelbyFlagEnabled(value: ShelbyIndexerBlobRow[keyof ShelbyIndexerBlobRow]) {
  return value === true || value === 1 || value === '1' || value === 'true'
}

function getShelbyObjectName(account: string, blobName: string) {
  const longAddress = normalizeAddress(account).replace(/^0x/i, '').padStart(64, '0')
  return `@${longAddress}/${blobName}`
}

async function queryShelbyIndexerBlobs(networkKey: AppNetworkKey, objectNames: string[]) {
  if (objectNames.length === 0) return []

  const response = await fetch(getNetworkConfig(networkKey).shelbyIndexerBase, {
    method: 'POST',
    headers: {
      ...getShelbyAuthHeaders(networkKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `query ShelbyBlobMetadata($names: [String!]!) {
        blobs(
          where: { object_name: { _in: $names } }
          limit: 1000
        ) {
          object_name
          is_committed
          is_deleted
          is_persisted
        }
      }`,
      variables: { names: objectNames },
    }),
  })

  const body = (await response.json().catch(() => ({}))) as ShelbyIndexerResponse
  if (!response.ok) {
    throw new Error(`ShelbyNet indexer returned ${response.status}.`)
  }

  if (body.errors?.length) {
    throw new Error(body.errors.map((error) => error.message).filter(Boolean).join('; ') || 'ShelbyNet indexer query failed.')
  }

  return body.data?.blobs ?? []
}

async function getRegisteredBlobNames(networkKey: AppNetworkKey, account: string, blobNames: string[]) {
  const objectNames = blobNames.map((blobName) => getShelbyObjectName(account, blobName))
  const indexedBlobs = await queryShelbyIndexerBlobs(networkKey, objectNames)
  const registeredObjectNames = new Set(
    indexedBlobs
      .filter(
        (blob) =>
          !!blob.object_name &&
          !isShelbyFlagEnabled(blob.is_deleted) &&
          (isShelbyFlagEnabled(blob.is_committed) || isShelbyFlagEnabled(blob.is_persisted))
      )
      .map((blob) => blob.object_name as string)
  )

  return new Set(blobNames.filter((blobName) => registeredObjectNames.has(getShelbyObjectName(account, blobName))))
}

async function confirmBlobExists(networkKey: AppNetworkKey, account: string, blobName: string) {
  const retryCount = getBlobConfirmRetryCount()

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const indexedBlobs = await queryShelbyIndexerBlobs(networkKey, [getShelbyObjectName(account, blobName)])
      const indexedMatch = indexedBlobs.find(
        (blob) =>
          blob.object_name === getShelbyObjectName(account, blobName) &&
          !isShelbyFlagEnabled(blob.is_deleted) &&
          (isShelbyFlagEnabled(blob.is_committed) || isShelbyFlagEnabled(blob.is_persisted))
      )

      if (indexedMatch) {
        return true
      }

      const response = await fetch(`${getShelbyRpcBase(networkKey)}/v1/blobs/${account}/${encodeBlobPath(blobName)}`, {
        method: 'GET',
        headers: {
          ...getShelbyAuthHeaders(networkKey),
          Range: 'bytes=0-0',
        },
      })

      if (response.ok || response.status === 206) {
        return true
      }
    } catch {
      // Ignore transient read errors while confirming write success.
    }

    if (attempt < retryCount - 1) {
      await sleep(1_000 + attempt * 500)
    }
  }

  return false
}

async function putBlobDirect(networkKey: AppNetworkKey, account: string, blobName: string, blobData: Uint8Array) {
  const response = await fetch(`${getShelbyRpcBase(networkKey)}/v1/blobs/${account}/${encodeBlobPath(blobName)}`, {
    method: 'PUT',
    headers: {
      ...getShelbyAuthHeaders(networkKey),
      'Content-Type': 'application/octet-stream',
    },
    body: new Blob([blobData.slice().buffer as ArrayBuffer], { type: 'application/octet-stream' }),
  })

  if (!response.ok) {
    throw new Error(`Failed to upload blob directly! status: ${response.status}, body: ${await readErrorBody(response)}`)
  }
}

function getMultipartPartSize(blobData: Uint8Array) {
  return Math.min(MULTIPART_PART_SIZE_BYTES, Math.max(blobData.length, 1))
}

async function runMultipartUploadOnce(
  networkKey: AppNetworkKey,
  account: string,
  blobName: string,
  blobData: Uint8Array,
  onProgress?: UploadShelbyBlobsWithWalletParams['onProgress']
) {
  const partSize = getMultipartPartSize(blobData)
  const uploadId = await startMultipartUpload(networkKey, account, blobName, partSize)
  const totalParts = Math.max(1, Math.ceil(blobData.length / partSize))

  for (let partIdx = 0; partIdx < totalParts; partIdx++) {
    const start = partIdx * partSize
    const end = Math.min(start + partSize, blobData.length)
    reportProgress(onProgress, blobName, 62 + Math.round(((partIdx + 1) / totalParts) * 18), 'uploading', 'Uploading data to Shelby')
    await uploadMultipartPart(networkKey, uploadId, partIdx, blobData.slice(start, end))
  }

  try {
    reportProgress(onProgress, blobName, 84, 'finalizing', 'Finalizing upload session')
    await completeMultipartUpload(networkKey, uploadId)
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
    const uploadSessionGone = message.includes('upload id') && message.includes('does not exist')
    const serverFinalizeError =
      message.includes('failed to complete multipart upload') &&
      (message.includes('status: 500') || message.includes('internal server error'))

    reportProgress(onProgress, blobName, 92, 'verifying', 'Checking whether the blob was still written')

    if ((uploadSessionGone || serverFinalizeError) && (await confirmBlobExists(networkKey, account, blobName))) {
      return
    }

    throw error
  }
}

async function putBlobWithRetry(
  networkKey: AppNetworkKey,
  account: string,
  blobName: string,
  blobData: Uint8Array,
  onProgress?: UploadShelbyBlobsWithWalletParams['onProgress']
) {
  if (networkKey === 'shelbynet' && blobData.length <= DIRECT_UPLOAD_MAX_BYTES) {
    try {
      reportProgress(onProgress, blobName, 64, 'uploading', 'Uploading directly to Shelby')
      await putBlobDirect(networkKey, account, blobName, blobData)
      reportProgress(onProgress, blobName, 92, 'verifying', 'Confirming the blob is readable')
      if (await confirmBlobExists(networkKey, account, blobName)) {
        return
      }
    } catch {
      // Fall through to multipart for ShelbyNet when direct upload is not accepted.
    }
  }

  const maxSessionAttempts = MULTIPART_SESSION_RETRY_COUNT
  let lastError: unknown

  for (let attempt = 0; attempt < maxSessionAttempts; attempt++) {
    try {
      await runMultipartUploadOnce(networkKey, account, blobName, blobData, onProgress)
      return
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
      const retryableAtSessionLevel =
        message.includes('failed to complete multipart upload') ||
        message.includes('failed to upload part') ||
        message.includes('upload id') ||
        message.includes('internal server error') ||
        message.includes('status: 500')

      if (!retryableAtSessionLevel || attempt === maxSessionAttempts - 1) {
        throw error
      }

      await sleep(1_200 * (attempt + 1))
      reportProgress(onProgress, blobName, 92, 'verifying', 'Checking whether the previous attempt actually landed')
      if (await confirmBlobExists(networkKey, account, blobName)) {
        return
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

export async function uploadShelbyBlobsWithWallet({
  walletAddress,
  signTransaction,
  blobs,
  expirationMicros,
  networkKey,
  onProgress,
}: UploadShelbyBlobsWithWalletParams): Promise<UploadShelbyBlobsWithWalletResult> {
  if (!signTransaction) {
    throw new Error('A connected wallet is required to sign this transaction.')
  }

  const account = normalizeAddress(walletAddress)
  const existingBlobNames = await getRegisteredBlobNames(
    networkKey,
    account,
    blobs.map(({ blobName }) => blobName)
  )
  const missingBlobs = blobs.filter(({ blobName }) => !existingBlobNames.has(blobName))
  let transactionHash: string | undefined
  const aptos = createAptosClient(networkKey)

  await assertShelbyNetFunding(aptos, account, missingBlobs.length > 0)

  if (missingBlobs.length > 0) {
    const provider = await createDefaultErasureCodingProvider()
    const commitments = await Promise.all(missingBlobs.map(async ({ blobData }) => generateCommitments(provider, blobData)))
    const chunksetSizeBytes = provider.config.erasure_k * provider.config.chunkSizeBytes

    const transaction = await aptos.transaction.build.simple({
      sender: account,
      data: ShelbyBlobClient.createBatchRegisterBlobsPayload({
        account: AccountAddress.from(account),
        expirationMicros,
        blobs: missingBlobs.map(({ blobName, blobData }, index) => ({
          blobName,
          blobSize: blobData.length,
          blobMerkleRoot: commitments[index].blob_merkle_root,
          numChunksets: expectedTotalChunksets(blobData.length, chunksetSizeBytes),
        })),
        encoding: provider.config.enumIndex,
      }),
    })

    missingBlobs.forEach(({ blobName }) => {
      reportProgress(onProgress, blobName, 36, 'awaiting_wallet', 'Waiting for wallet approval')
    })

    const { authenticator } = await signTransaction({
      transactionOrPayload: transaction,
    })

    missingBlobs.forEach(({ blobName }) => {
      reportProgress(onProgress, blobName, 48, 'registering', 'Submitting blob registration onchain')
    })

    const pending = await aptos.transaction.submit.simple({
      transaction,
      senderAuthenticator: authenticator,
    })

    transactionHash = pending.hash
    await aptos.waitForTransaction({
      transactionHash: pending.hash,
      options: {
        checkSuccess: true,
        waitForIndexer: true,
      },
    })
    await sleep(INDEXER_SETTLE_DELAY_MS)
  }

  await Promise.all(
    blobs.map(async ({ blobName, blobData }) => {
      reportProgress(onProgress, blobName, 58, 'uploading', 'Starting Shelby upload')
      await putBlobWithRetry(networkKey, account, blobName, blobData, onProgress)
      reportProgress(onProgress, blobName, 100, 'done', 'Stored successfully')
    })
  )

  return {
    registrationStatus: missingBlobs.length > 0 ? 'registered' : 'existing',
    transactionHash,
  }
}
