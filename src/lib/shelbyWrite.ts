import { Aptos, AptosConfig, AccountAddress } from '@aptos-labs/ts-sdk'
import type { WalletContextState } from '@aptos-labs/wallet-adapter-react'
import {
  createBlobKey,
  createDefaultErasureCodingProvider,
  expectedTotalChunksets,
  generateCommitments,
  ShelbyBlobClient,
  type ShelbyClient,
} from '@shelby-protocol/sdk/browser'
import { getAptosApiKey, getNetworkConfig, normalizeAddress, type AppNetworkKey } from './aptos'
import { getShelbyApiKey, getShelbyRpcBase } from './shelby'

type WalletSignTransactionFn = WalletContextState['signTransaction'] | null | undefined

interface UploadShelbyBlobsWithWalletParams {
  client: ShelbyClient
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
const TESTNET_MULTIPART_PART_SIZE_BYTES = 1_048_576
const DIRECT_UPLOAD_MAX_BYTES = 5 * 1024 * 1024
const MULTIPART_SESSION_RETRY_COUNT = 2

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function getBlobConfirmRetryCount(networkKey: AppNetworkKey) {
  return networkKey === 'shelbynet' ? 4 : 10
}

function createAptosClient(networkKey: AppNetworkKey) {
  const networkConfig = getNetworkConfig(networkKey)
  const apiKey = getAptosApiKey(networkKey)

  return new Aptos(
    new AptosConfig({
      network: networkConfig.aptosNetwork,
      fullnode: networkConfig.aptosApiBase,
      ...(apiKey ? { clientConfig: { API_KEY: apiKey } } : {}),
    })
  )
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

async function confirmBlobExists(client: ShelbyClient, networkKey: AppNetworkKey, account: string, blobName: string) {
  const blobKey = createBlobKey({ account, blobName })
  const retryCount = getBlobConfirmRetryCount(networkKey)

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const coordinationMatch = await client.coordination.getBlobs({
        where: {
          blob_name: {
            _eq: blobKey,
          },
        },
      })

      if (coordinationMatch.some((blob) => blob.name === blobKey && blob.isWritten)) {
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

function getMultipartPartSize(blobData: Uint8Array, networkKey: AppNetworkKey) {
  const preferredPartSize = networkKey === 'testnet' ? TESTNET_MULTIPART_PART_SIZE_BYTES : blobData.length || 1
  return Math.min(preferredPartSize, Math.max(blobData.length, 1))
}

async function runMultipartUploadOnce(
  client: ShelbyClient,
  networkKey: AppNetworkKey,
  account: string,
  blobName: string,
  blobData: Uint8Array,
  onProgress?: UploadShelbyBlobsWithWalletParams['onProgress']
) {
  const partSize = getMultipartPartSize(blobData, networkKey)
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

    if ((uploadSessionGone || serverFinalizeError) && (await confirmBlobExists(client, networkKey, account, blobName))) {
      return
    }

    throw error
  }
}

async function putBlobWithRetry(
  client: ShelbyClient,
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
      if (await confirmBlobExists(client, networkKey, account, blobName)) {
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
      await runMultipartUploadOnce(client, networkKey, account, blobName, blobData, onProgress)
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
      if (await confirmBlobExists(client, networkKey, account, blobName)) {
        return
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

export async function uploadShelbyBlobsWithWallet({
  client,
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
  const blobKeys = blobs.map(({ blobName }) => createBlobKey({ account, blobName }))
  const existing = await client.coordination.getBlobs({
    where: {
      blob_name: {
        _in: blobKeys,
      },
    },
  })

  const missingBlobs = blobs.filter(({ blobName }) => !existing.some((blob) => blob.name === createBlobKey({ account, blobName })))
  let transactionHash: string | undefined

  if (missingBlobs.length > 0) {
    const aptos = createAptosClient(networkKey)
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
      await putBlobWithRetry(client, networkKey, account, blobName, blobData, onProgress)
      reportProgress(onProgress, blobName, 100, 'done', 'Stored successfully')
    })
  )

  return {
    registrationStatus: missingBlobs.length > 0 ? 'registered' : 'existing',
    transactionHash,
  }
}
