interface SkeletonProps {
  width?: string
  height?: string
  borderRadius?: string
  className?: string
}

export function Skeleton({ width = '100%', height = '12px', borderRadius = '6px', className = '' }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #1e0028 25%, #3a0055 50%, #1e0028 75%)',
        backgroundSize: '1200px 100%',
        animation: 'skeleton-shimmer 1.6s infinite linear',
        display: 'block',
      }}
    />
  )
}

export function ProfileSkeleton() {
  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-6 pb-24">
        <div className="mt-6 rounded-2xl overflow-hidden"
          style={{ background: 'var(--dark-2)', border: '1px solid rgba(255,105,176,0.12)' }}>
          {/* Banner */}
          <Skeleton height="56px" borderRadius="0" />
          <div className="px-6 pb-6">
            {/* Avatar */}
            <Skeleton width="52px" height="52px" borderRadius="12px"
              className="mb-4" />
            {/* Name */}
            <Skeleton width="140px" height="18px" className="mb-2" />
            {/* Address */}
            <Skeleton width="200px" height="11px" className="mb-3" />
            {/* Bio */}
            <Skeleton width="260px" height="11px" className="mb-2" />
            <Skeleton width="180px" height="11px" className="mb-4" />
            {/* Links */}
            <div className="flex gap-3">
              <Skeleton width="55px" height="11px" />
              <Skeleton width="55px" height="11px" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Skeleton height="64px" borderRadius="12px" />
          <Skeleton height="64px" borderRadius="12px" />
          <Skeleton height="64px" borderRadius="12px" />
        </div>

        {/* Works */}
        <div className="mt-6">
          <Skeleton width="100px" height="10px" className="mb-4" />
          <div className="space-y-2">
            {[140, 120, 160].map((w, i) => (
              <div key={i}
                style={{ background: 'var(--dark-2)', border: '1px solid rgba(255,105,176,0.08)', borderRadius: '12px', padding: '12px' }}
                className="flex items-center gap-3">
                <Skeleton width="36px" height="36px" borderRadius="10px" />
                <div className="flex-1 space-y-2">
                  <Skeleton width={`${w}px`} height="12px" />
                  <Skeleton width="90px" height="9px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <div className="space-y-2">
            <Skeleton width="160px" height="22px" />
            <Skeleton width="120px" height="11px" />
          </div>
          <Skeleton width="120px" height="36px" borderRadius="12px" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[1,2,3,4].map(i => (
            <div key={i} style={{ background: 'var(--dark-2)', border: '1px solid rgba(255,105,176,0.08)', borderRadius: '12px', padding: '16px' }}>
              <Skeleton width="80px" height="10px" className="mb-3" />
              <Skeleton width="60px" height="22px" className="mb-2" />
              <Skeleton width="90px" height="9px" />
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Recent works */}
          <div className="md:col-span-2">
            <Skeleton width="100px" height="10px" className="mb-3" />
            <div style={{ background: 'var(--dark-2)', border: '1px solid rgba(255,105,176,0.08)', borderRadius: '12px', padding: '16px', marginBottom: '8px' }}>
              <div className="flex items-center justify-center gap-2">
                <Skeleton width="180px" height="11px" />
              </div>
            </div>
            <div className="space-y-2">
              {[150, 130, 140].map((w, i) => (
                <div key={i}
                  style={{ background: 'var(--dark-2)', border: '1px solid rgba(255,105,176,0.08)', borderRadius: '12px', padding: '12px' }}
                  className="flex items-center gap-3">
                  <Skeleton width="32px" height="32px" borderRadius="8px" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width={`${w}px`} height="12px" />
                    <Skeleton width="90px" height="9px" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {[100, 140, 110].map((h, i) => (
              <Skeleton key={i} height={`${h}px`} borderRadius="12px" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
