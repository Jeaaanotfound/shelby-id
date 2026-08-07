import { useRef, useState } from 'react'
import { X, Camera, Upload, CheckCircle, Loader, AlertCircle } from 'lucide-react'
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react'
import { useAppSettings } from '../context/AppSettings'
import { useToast } from '../context/ToastContext'
import { sameAddress } from '../lib/aptos'
import { createExpirationMicros, formatShelbyErrorMessage, getAvatarBlobName, SHELBY_BLOB_EXPIRATION_DAYS } from '../lib/shelby'
import { uploadShelbyBlobsWithWallet } from '../lib/shelbyWrite'
import { ensureWalletMatchesAppNetwork, getTransactionErrorMessage, isWalletRejectedError } from '../lib/transactions'

interface AvatarPickerProps {
  walletAddress: string
  currentAvatarUrl: string | null
  onClose: () => void
  onSuccess: () => void
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

const PRESET_GRADIENTS = [
  ['oklch(62% 0.22 348)', 'oklch(52% 0.24 293)'],
  ['oklch(55% 0.22 240)', 'oklch(45% 0.20 280)'],
  ['oklch(60% 0.20 180)', 'oklch(50% 0.22 220)'],
  ['oklch(65% 0.22 80)', 'oklch(55% 0.22 40)'],
  ['oklch(60% 0.22 140)', 'oklch(50% 0.22 160)'],
  ['oklch(55% 0.22 300)', 'oklch(62% 0.22 348)'],
  ['oklch(65% 0.18 30)', 'oklch(58% 0.20 350)'],
  ['oklch(58% 0.20 200)', 'oklch(50% 0.18 240)'],
]

export default function AvatarPicker({ walletAddress, currentAvatarUrl, onClose, onSuccess }: AvatarPickerProps) {
  const { networkConfig, networkKey } = useAppSettings()
  const { notify } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const { account, network, signAndSubmitTransaction } = useAptosWallet()

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Choose an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Keep the image under 5 MB.')
      return
    }

    setErrorMsg('')
    setSelectedPreset(null)
    setPreviewFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handlePresetSelect = (index: number) => {
    setSelectedPreset(index)
    setPreview(null)
    setPreviewFile(null)
    setErrorMsg('')
  }

  const presetToBlob = async (index: number): Promise<File> => {
    const [c1, c2] = PRESET_GRADIENTS[index]
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createLinearGradient(0, 0, 256, 256)
    grad.addColorStop(0, c1)
    grad.addColorStop(1, c2)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(128, 128, 128, 0, Math.PI * 2)
    ctx.fill()

    return new Promise<File>((resolve) =>
      canvas.toBlob((blob) => resolve(new File([blob!], 'avatar.png', { type: 'image/png' })), 'image/png')
    )
  }

  const handleUpload = async () => {
    if (!account || !signAndSubmitTransaction) return
    if (!previewFile && selectedPreset === null) return

    setUploadState('uploading')
    setErrorMsg('')

    try {
      if (!sameAddress(account.address.toString(), walletAddress)) {
        setErrorMsg('This wallet does not match the profile you are editing.')
        setUploadState('error')
        notify({
          tone: 'error',
          title: 'Wallet mismatch',
          description: 'Connect the wallet that owns this profile before updating the avatar.',
        })
        return
      }

      await ensureWalletMatchesAppNetwork({
        walletNetwork: network,
        networkKey,
        notify,
      })

      const fileToUpload = previewFile ?? (await presetToBlob(selectedPreset!))
      const blobData = new Uint8Array(await fileToUpload.arrayBuffer())

      const result = await uploadShelbyBlobsWithWallet({
        walletAddress,
        signAndSubmitTransaction,
        blobs: [{ blobName: getAvatarBlobName(walletAddress), blobData }],
        expirationMicros: createExpirationMicros(SHELBY_BLOB_EXPIRATION_DAYS),
        networkKey,
      })

      setUploadState('success')
      notify({
        tone: 'success',
        title: 'Avatar updated',
        description:
          result.registrationStatus === 'registered'
            ? `Your new avatar is live on ${networkConfig.label}.`
            : `Your avatar was updated on ${networkConfig.label}. No extra wallet approval was needed because the blob was already registered.`,
      })
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1400)
    } catch (err) {
      const message = isWalletRejectedError(err)
        ? getTransactionErrorMessage(err, 'Save avatar', networkKey)
        : formatShelbyErrorMessage(err, networkKey)
      setErrorMsg(message)
      setUploadState('error')
      notify({
        tone: 'error',
        title: 'Avatar update failed',
        description: message,
      })
    }
  }

  const canUpload = (previewFile !== null || selectedPreset !== null) && uploadState !== 'uploading'

  return (
    <>
      <div className="fixed inset-0 z-40 animate-fade-in" style={{ background: 'oklch(0% 0 0 / 0.45)', backdropFilter: 'blur(8px)' }} onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-scale-up">
        <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: '0 24px 64px oklch(0% 0 0 / 0.18), 0 1px 0 oklch(100% 0 0 / 0.5) inset' }}>
          <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <p className="text-[10px] font-mono tracking-widest uppercase mb-0.5" style={{ color: 'var(--accent)' }}>identity</p>
              <h2 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>Update avatar</h2>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div>
              <p className="text-[11px] font-mono tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Preview</p>
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden" style={{ border: '2px solid var(--accent-border)', boxShadow: '0 4px 16px oklch(62% 0.22 348 / 0.15)' }}>
                    {preview ? (
                      <img src={preview} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : selectedPreset !== null ? (
                      <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${PRESET_GRADIENTS[selectedPreset][0]} 0%, ${PRESET_GRADIENTS[selectedPreset][1]} 100%)` }} />
                    ) : currentAvatarUrl ? (
                      <img src={currentAvatarUrl} alt="Current avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--violet) 100%)', color: 'oklch(100% 0 0)' }}>
                        {walletAddress[2]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Profile avatar</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Stored on Shelby Protocol.<br />Shown on your {networkConfig.label} profile and gallery.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-mono tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Upload image</p>
              <div
                className="upload-drop-zone py-7 flex flex-col items-center gap-2 cursor-pointer rounded-xl transition-all"
                style={{ border: isDragging ? '1.5px dashed var(--accent)' : undefined, background: isDragging ? 'var(--accent-subtle)' : undefined }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <Camera size={22} style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Drop an image here or <span style={{ color: 'var(--accent)', fontWeight: 500 }}>browse files</span>
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>PNG, JPG, or WEBP. Maximum 5 MB.</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file) }} />
            </div>

            <div>
              <p className="text-[11px] font-mono tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Or choose a preset</p>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_GRADIENTS.map((colors, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetSelect(index)}
                    className="w-full aspect-square rounded-xl transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
                      outline: selectedPreset === index ? `2.5px solid var(--accent)` : '2.5px solid transparent',
                      outlineOffset: '2px',
                      transform: selectedPreset === index ? 'scale(1.08)' : 'scale(1)',
                      boxShadow: selectedPreset === index ? '0 4px 12px oklch(62% 0.22 348 / 0.3)' : 'none',
                    }}
                    aria-label={`Gradient preset ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm" style={{ background: 'oklch(55% 0.22 25 / 0.08)', border: '1px solid oklch(55% 0.22 25 / 0.20)', color: 'oklch(50% 0.20 25)' }}>
                <AlertCircle size={14} className="flex-shrink-0" />
                {errorMsg}
              </div>
            )}
          </div>

          <div className="px-6 pb-6 flex items-center gap-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <button
              onClick={handleUpload}
              disabled={!canUpload}
              className="btn-pink flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold flex-1 justify-center"
              style={{ boxShadow: canUpload ? '0 4px 16px oklch(62% 0.22 348 / 0.25)' : 'none' }}
            >
              {uploadState === 'uploading' && <Loader size={14} className="animate-spin" />}
              {uploadState === 'success' && <CheckCircle size={14} />}
              {uploadState === 'uploading' ? `Saving on ${networkConfig.label}...`
                : uploadState === 'success' ? 'Saved'
                : uploadState === 'error' ? 'Try again'
                : <><Upload size={14} /> Save avatar</>}
            </button>
            <button onClick={onClose} className="btn-ghost px-5 py-2.5 rounded-full text-sm">Cancel</button>
          </div>
        </div>
      </div>
    </>
  )
}
