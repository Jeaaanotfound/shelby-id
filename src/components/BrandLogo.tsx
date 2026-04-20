import { useId } from 'react'

type BrandLogoProps = {
  size?: number
  wordmark?: boolean
  subtitle?: boolean
  className?: string
}

export function BrandMark({ size = 30 }: { size?: number }) {
  const gradientId = useId()
  const frameId = `${gradientId}-frame`
  const railId = `${gradientId}-rail`
  const glowId = `${gradientId}-glow`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={frameId} x1="12" y1="9" x2="53" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="color-mix(in oklch, var(--surface-on-dark) 94%, transparent)" />
          <stop offset="1" stopColor="color-mix(in oklch, var(--surface-on-dark) 32%, var(--accent) 68%)" />
        </linearGradient>
        <linearGradient id={railId} x1="18" y1="16" x2="47" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--accent-bright)" />
          <stop offset="0.45" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--violet)" />
        </linearGradient>
        <radialGradient id={glowId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(47.5 16.25) rotate(90) scale(14)">
          <stop stopColor="color-mix(in oklch, var(--accent) 32%, transparent)" />
          <stop offset="1" stopColor="transparent" />
        </radialGradient>
      </defs>

      <path
        d="M32 6 50.5 16.5V37.5L32 58 13.5 37.5V16.5L32 6Z"
        fill={`url(#${glowId})`}
        opacity="0.95"
      />
      <path
        d="M32 6 50.5 16.5V37.5L32 58 13.5 37.5V16.5L32 6Z"
        fill="color-mix(in oklch, var(--bg-surface) 84%, transparent)"
        stroke={`url(#${frameId})`}
        strokeWidth="2.25"
        strokeLinejoin="round"
      />
      <path
        d="M32 12.4 44.4 19.45V33.9L32 47.65 19.6 33.9V19.45L32 12.4Z"
        fill="color-mix(in oklch, var(--bg-base) 72%, transparent)"
        stroke="color-mix(in oklch, var(--surface-on-dark) 18%, transparent)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M23 18.5H27.8V44.25H23V18.5Z"
        fill="color-mix(in oklch, var(--surface-on-dark) 18%, transparent)"
      />
      <path
        d="M36.2 18.5H41V44.25H36.2V18.5Z"
        fill="color-mix(in oklch, var(--surface-on-dark) 12%, transparent)"
      />
      <path
        d="M22 21.25C22 18.76 23.87 17 26.53 17H41V22.1H28.08C26.49 22.1 25.45 22.95 25.45 24.3C25.45 25.76 26.56 26.56 28.2 26.56H35.08C40.28 26.56 43.6 29.7 43.6 34.47C43.6 39.76 39.71 43 33.62 43H20.95V37.9H32.35C35.38 37.9 37.08 36.73 37.08 34.63C37.08 32.68 35.61 31.66 32.79 31.66H28.32C24.26 31.66 22 29.1 22 25.09V21.25Z"
        fill={`url(#${railId})`}
      />
      <path
        d="M18.7 18.45 32 32.7 45.3 18.45"
        stroke="color-mix(in oklch, var(--accent) 24%, transparent)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx="47.5" cy="16.25" r="2.65" fill="var(--accent)" />
      <circle cx="47.5" cy="16.25" r="5.25" fill="color-mix(in oklch, var(--accent) 12%, transparent)" />
    </svg>
  )
}

export default function BrandLogo({
  size = 30,
  wordmark = true,
  subtitle = true,
  className = '',
}: BrandLogoProps) {
  return (
    <div className={`brand-logo ${className}`.trim()}>
      <div className="logo-orb">
        <BrandMark size={size} />
      </div>
      {wordmark && (
        <div className="brand-logo__lockup">
          <p className="brand-logo__title">
            <span className="brand-logo__word">Shelby</span>
            <span className="brand-logo__tag">ID</span>
          </p>
          {subtitle && <p className="brand-logo__subtitle">Curated identity rails</p>}
        </div>
      )}
    </div>
  )
}
