import Skeleton from 'react-loading-skeleton'

export default function SkeletonRoom() {
  return (
    <div className="container">
      <div style={{ marginBottom: '24px' }}>
        <Skeleton height={36} width={280} style={{ marginBottom: '8px' }} />
        <Skeleton height={20} width={120} />
      </div>

      <div className="card">
        <Skeleton height={22} width={140} style={{ marginBottom: '16px' }} />
        <Skeleton height={48} style={{ marginBottom: '16px', borderRadius: '8px' }} />
        <Skeleton count={3} height={56} style={{ marginBottom: '12px', borderRadius: '8px' }} />
      </div>

      <div className="card">
        <Skeleton height={22} width={180} style={{ marginBottom: '16px' }} />
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <Skeleton height={40} style={{ flex: 1, borderRadius: '8px' }} />
          <Skeleton height={40} style={{ flex: 1, borderRadius: '8px' }} />
          <Skeleton height={40} width={100} style={{ borderRadius: '8px' }} />
        </div>
      </div>

      <div className="card">
        <Skeleton height={22} width={200} style={{ marginBottom: '16px' }} />
        <Skeleton count={4} height={72} style={{ marginBottom: '10px', borderRadius: '8px' }} />
      </div>
    </div>
  )
}
