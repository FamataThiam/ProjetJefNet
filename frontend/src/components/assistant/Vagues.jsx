
const VAGUE = 'M0 40 Q50 15 100 40 T200 40 T300 40 T400 40 V100 H0Z'

export default function Vagues({ taille = 64, className = '' }) {
  return (
    <span className={`vagues-jef ${className}`} style={{ '--t': `${taille}px` }} aria-hidden="true">
      {['v1', 'v2', 'v3'].map((v) => (
        <svg key={v} className={v} viewBox="0 0 400 100" preserveAspectRatio="none">
          <path d={VAGUE} />
        </svg>
      ))}
    </span>
  )
}