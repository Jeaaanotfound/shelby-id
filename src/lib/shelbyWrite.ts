import { Aptos, AptosConfig, AccountAddress } from '@aptos-labs/ts-sdk'
import type { WalletContextState } from '@aptos-labs/wallet-adapter-react'
import {
  createDefaultErasureCodingProvider,
  expectedTotalChunksets,
  generateCommitments,
  requiredAckCount,
  ShelbyBlobClient,
  SHELBYUSD_FA_METADATA_ADDRESS,
} from '@shelby-protocol/sdk/browser'
import { getAptosApiKey, getNetworkConfig, normalizeAddress, type AppNetworkKey } from './aptos'
import { createShelbyClient } from './shelby'

type WalletSignAndSubmitTransactionFn = WalletContextState['signAndSubmitTransaction'] | null | undefined

interface UploadShelbyBlobsWithWalletParams {
  walletAddress: string
  signAndSubmitTransaction: WalletSignAndSubmitTransactionFn
  blobs: {
    blobName: string
    blobData: Uint8Array
  }[]
  expirationMicros: number
  networkKey: AppNetworkKey
  onProgress?: (update: UploadProgressUpdate) => void
}

interface UploadShelbyBlobsWithWalletResult {
  registrationStatus: 'registered'
  transactionHash?: string
  registrationTransactionHash?: string
  transactionHashes?: string[]
  transactionBlobName?: string
}

export interface UploadProgressUpdate {
  blobName: string
  progress: number
  stage: 'awaiting_wallet' | 'registering' | 'uploading' | 'finalizing' | 'verifying' | 'done'
  detail?: string
}

const INDEXER_SETTLE_DELAY_MS = 1_500
const READ_BACK_ATTEMPTS = 12
const READ_BACK_DELAY_MS = 1_000
const SHELBYNET_LOCATION_HINT = 'shelbynet-1'

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
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

function getShelbyObjectName(account: string, blobName: string) {
  const longAddress = normalizeAddress(account).replace(/^0x/i, '').padStart(64, '0')
  return `@${longAddress}/${blobName}`
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false

  return left.every((byte, index) => byte === right[index])
}

function hexToBytes(value: string): Uint8Array {
  const hex = value.replace(/^0x/i, '')
  const bytes = new Uint8Array(Math.ceil(hex.length / 2))

  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16)
  }

  return bytes
}

async function waitForWrittenBlob({
  shelbyClient,
  account,
  blobName,
  expectedSize,
  expectedMerkleRoot,
}: {
  shelbyClient: ReturnType<typeof createShelbyClient>
  account: string
  blobName: string
  expectedSize: number
  expectedMerkleRoot: string
}) {
  const readMetadata = shelbyClient.coordination.getFullObjectMetadata

  if (typeof readMetadata !== 'function') {
    throw new Error('Shelby SDK read-back verification is unavailable in this build.')
  }

  let lastReadError: unknown = null

  for (let attempt = 0; attempt < READ_BACK_ATTEMPTS; attempt += 1) {
    try {
      const metadata = await readMetadata.call(shelbyClient.coordination, {
        account,
        name: blobName,
      })

      if (
        metadata &&
        metadata.isWritten &&
        !metadata.isDeleted &&
        metadata.size === expectedSize &&
        equalBytes(metadata.blobMerkleRoot, hexToBytes(expectedMerkleRoot))
      ) {
        return metadata
      }
    } catch (error) {
      lastReadError = error
    }

    if (attempt < READ_BACK_ATTEMPTS - 1) {
      await sleep(READ_BACK_DELAY_MS)
    }
  }

  const detail = lastReadError instanceof Error ? ` Last read: ${lastReadError.message}` : ''
  throw new Error(
    `Shelby committed '${blobName}', but read-back verification did not confirm a written blob yet.${detail}`
  )
}

export async function uploadShelbyBlobsWithWallet({
  walletAddress,
  signAndSubmitTransaction,
  blobs,
  expirationMicros,
  networkKey,
  onProgress,
}: UploadShelbyBlobsWithWalletParams): Promise<UploadShelbyBlobsWithWalletResult> {
  if (!signAndSubmitTransaction) {
    throw new Error('A connected wallet is required to approve this transaction.')
  }

  const account = normalizeAddress(walletAddress)
  const aptos = createAptosClient(networkKey)
  const shelbyClient = createShelbyClient(networkKey)

  if (blobs.length === 0) {
    return { registrationStatus: 'registered' }
  }

  await assertShelbyNetFunding(aptos, account, true)

  const provider = await createDefaultErasureCodingProvider()
  const prepared = await Promise.all(
    blobs.map(async (blob) => ({
      blob,
      commitments: await generateCommitments(provider, blob.blobData),
    }))
  )
  const chunksetSizeBytes = provider.config.erasure_k * provider.config.chunkSizeBytes
  const transactionPayload = ShelbyBlobClient.createBatchRegisterBlobsPayload({
    account: AccountAddress.from(account),
    locationHint: SHELBYNET_LOCATION_HINT,
    expirationMicros,
    blobs: prepared.map(({ blob, commitments }) => ({
      blobName: blob.blobName,
      blobSize: blob.blobData.length,
      blobMerkleRoot: commitments.blob_merkle_root,
      numChunksets: expectedTotalChunksets(blob.blobData.length, chunksetSizeBytes),
    })),
    encoding: provider.config.enumIndex,
  })

  prepared.forEach(({ blob }) => {
    reportProgress(onProgress, blob.blobName, 36, 'awaiting_wallet', 'Waiting for wallet approval')
  })

  // Let the wallet build and submit the registration transaction. The SDK
  // then uploads by UID through the v2 chunkset API and commits each object.
  const registrationPending = await signAndSubmitTransaction({
    data: transactionPayload,
  })

  prepared.forEach(({ blob }) => {
    reportProgress(onProgress, blob.blobName, 48, 'registering', 'Submitting blob registration onchain')
  })

  const registrationReceipt = await aptos.waitForTransaction({
    transactionHash: registrationPending.hash,
    options: {
      checkSuccess: true,
      waitForIndexer: true,
    },
  })
  const registeredUids = ShelbyBlobClient.registeredBlobUids(
    'events' in registrationReceipt ? registrationReceipt.events : [],
    shelbyClient.coordination.deployer
  )
  const uidByObjectName = new Map(registeredUids.map(({ objectName, uid }) => [objectName, uid]))
  const requiredAcks = requiredAckCount(provider.config.erasure_n)

  const uploads = await Promise.all(
    prepared.map(async ({ blob, commitments }) => {
      const uid = uidByObjectName.get(getShelbyObjectName(account, blob.blobName))
      if (uid === undefined) {
        throw new Error(`Shelby did not return a UID for '${blob.blobName}' in registration ${registrationPending.hash}.`)
      }

      reportProgress(onProgress, blob.blobName, 58, 'uploading', 'Uploading verified chunksets to Shelby')
      const { spAcks } = await shelbyClient.rpc.putBlobChunksets({
        accountAddress: account,
        uid,
        blobData: blob.blobData,
        commitments,
        onProgress: ({ uploadedBytes, totalBytes }) => {
          const ratio = totalBytes === 0 ? 1 : uploadedBytes / totalBytes
          reportProgress(
            onProgress,
            blob.blobName,
            58 + Math.min(24, Math.round(ratio * 24)),
            'uploading',
            `Uploaded ${Math.round(ratio * 100)}%`
          )
        },
      })

      if (spAcks.length < requiredAcks) {
        throw new Error(
          `Shelby returned ${spAcks.length} storage acknowledgements for '${blob.blobName}', but ${requiredAcks} are required.`
        )
      }

      return { blob, uid, spAcks, merkleRoot: commitments.blob_merkle_root }
    })
  )

  let transactionHash = registrationPending.hash
  const transactionHashes = [registrationPending.hash]
  let transactionBlobName: string | undefined
  for (const { blob, uid, spAcks, merkleRoot } of uploads) {
    reportProgress(onProgress, blob.blobName, 84, 'finalizing', 'Waiting for wallet approval to finalize')
    const commitPending = await signAndSubmitTransaction({
      data: ShelbyBlobClient.createCommitObjectPayload({
        deployer: shelbyClient.coordination.deployer,
        uid,
        blobName: blob.blobName,
        overwrite: true,
        storageProviderAcks: spAcks,
      }),
    })
    transactionHash = commitPending.hash
    transactionHashes.push(commitPending.hash)
    transactionBlobName = blob.blobName

    reportProgress(onProgress, blob.blobName, 92, 'verifying', 'Confirming the Shelby commit')
    const commitReceipt = await aptos.waitForTransaction({
      transactionHash: commitPending.hash,
      options: {
        checkSuccess: true,
        waitForIndexer: true,
      },
    })
    const commitRejection = ShelbyBlobClient.findObjectCommitRejection(
      'events' in commitReceipt ? commitReceipt.events : [],
      shelbyClient.coordination.deployer,
      uid
    )
    if (commitRejection) {
      throw new Error(`Shelby rejected '${blob.blobName}' during commit: ${commitRejection}.`)
    }

    reportProgress(onProgress, blob.blobName, 96, 'verifying', 'Reading back written metadata from ShelbyNet')
    await waitForWrittenBlob({
      shelbyClient,
      account,
      blobName: blob.blobName,
      expectedSize: blob.blobData.length,
      expectedMerkleRoot: merkleRoot,
    })

    reportProgress(onProgress, blob.blobName, 100, 'done', 'Stored and verified on ShelbyNet')
  }

  await sleep(INDEXER_SETTLE_DELAY_MS)

  return {
    registrationStatus: 'registered',
    transactionHash,
    registrationTransactionHash: registrationPending.hash,
    transactionHashes,
    transactionBlobName,
  }
}
