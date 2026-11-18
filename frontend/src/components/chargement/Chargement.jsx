import { useId } from 'react'


const R = 34
const TOUR = 2 * Math.PI * R 


const MORCEAUX = [
  [0.5, 1.8, 0],
  [0.12, 1.25, -0.3],
  [0.05, 2.4, -0.9],
]

export default function Chargement({
  plein = false,
  texte = null,
  taille = 96,
  couleurs = ['#ff0a8f', '#ff6a13'], 
}) {
  const id = useId().replace(/:/g, '')

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={texte || 'Chargement'}
      className={`flex flex-col items-center justify-center gap-4 ${plein ? 'fixed inset-0 z-50 bg-white' : 'py-12'}`}
    >
      <svg width={taille} height={taille} viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id={`deg-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.1" stopColor={couleurs[0]} />
            <stop offset="0.95" stopColor={couleurs[1]} />
          </linearGradient>
          <filter id={`gluant-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="flou" />
            <feColorMatrix in="flou" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" />
          </filter>
          <mask id={`forme-${id}`}>
            <g filter={`url(#gluant-${id})`}>
              <g className="liquide-ensemble">
                {MORCEAUX.map(([part, duree, decalage], i) => (
                  <circle
                    key={i}
                    className={i === 0 ? 'liquide-morceau liquide-principal' : 'liquide-morceau'}
                    style={{ animationDuration: i === 0 ? `${duree}s, ${duree * 2}s` : `${duree}s`, animationDelay: `${decalage}s` }}
                    cx="50" cy="50" r={R}
                    fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${part * TOUR} ${TOUR}`}
                  />
                ))}
              </g>
            </g>
          </mask>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill={`url(#deg-${id})`} mask={`url(#forme-${id})`} />
      </svg>
      {texte && <p className="text-sm font-medium text-slate-500">{texte}</p>}
    </div>
  )
}