// Chargement « liquide » : un anneau en dégradé qui tourne,
// et des gouttes qui s'en détachent puis s'y recollent (filtre « gooey »).
// plein = true : occupe tout l'écran (changement de page) ; sinon s'insère dans un bloc.
export default function Chargement({ plein = false, texte = 'Chargement…', taille = 96 }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-4 ${plein ? 'fixed inset-0 z-50 bg-white/90 backdrop-blur-sm' : 'py-12'}`}
    >
      <svg width={taille} height={taille} viewBox="0 0 100 100" className="chargement-liquide" aria-hidden="true">
        <defs>
          <linearGradient id="degrade-jef" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2ba8e0" />
            <stop offset="100%" stopColor="#0174ab" />
          </linearGradient>
          <filter id="gluant">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="flou" />
            <feColorMatrix in="flou" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="colle" />
            <feComposite in="SourceGraphic" in2="colle" operator="atop" />
          </filter>
        </defs>
        <g filter="url(#gluant)">
          <g className="chargement-rotation">
            {/* anneau ouvert */}
            <circle cx="50" cy="50" r="32" fill="none" stroke="url(#degrade-jef)" strokeWidth="11"
              strokeLinecap="round" strokeDasharray="150 51" />
            {/* gouttes */}
            <circle className="goutte goutte-1" cx="50" cy="18" r="6.5" fill="#2ba8e0" />
            <circle className="goutte goutte-2" cx="50" cy="18" r="5" fill="#2ba8e0" />
          </g>
        </g>
      </svg>
      {texte && <p className="text-sm font-medium text-slate-500">{texte}</p>}
    </div>
  )
}
