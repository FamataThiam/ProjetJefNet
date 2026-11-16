import { useRef } from 'react'
import useTheme from '../../hooks/useTheme'
import { ETAPES, fondPourNiveau } from '../../lib/couleurs'

// Bande en verre collée au coin en haut à droite de l'écran.
// Elle longe le haut, s'arrondit dans le coin, puis descend le long du bord droit.
// Bout du haut = bleu nuit, bout du bord droit = clair : on glisse la poignée de l'un à l'autre.
const S = 120          // longueur de la bande sur chaque bord (px)
const R = 58           // rayon de l'arrondi du coin
const E = 30           // épaisseur de la bande
const r = R - E / 2    // rayon de la ligne du milieu
const DROIT = S - R    // longueur de chaque partie droite
const ARC = (Math.PI / 2) * r
const TOTAL = DROIT + ARC + DROIT
const MARGE = E / 2 + 4 // la poignée s'arrête avant les bouts

// point de la ligne du milieu à la distance d (depuis le bout du haut)
function pointA(d) {
  if (d <= DROIT) return [d, E / 2]
  if (d <= DROIT + ARC) {
    const a = (d - DROIT) / r // 0 → en haut, π/2 → à droite
    return [DROIT + r * Math.sin(a), R - r * Math.cos(a)]
  }
  return [S - E / 2, R + (d - DROIT - ARC)]
}

const distanceDe = (niveau) => MARGE + niveau * (TOTAL - 2 * MARGE)
const versNiveau = (d) => Math.min(1, Math.max(0, (d - MARGE) / (TOTAL - 2 * MARGE)))

// ligne du milieu (pour la couleur) et contour de la bande (pour le verre)
const milieu = `M ${E / 2} ${E / 2} H ${DROIT} A ${r} ${r} 0 0 1 ${S - E / 2} ${R} V ${S - E / 2}`
const contour = `M 0 0 H ${DROIT} A ${R} ${R} 0 0 1 ${S} ${R} V ${S - E / 2}
  A ${E / 2} ${E / 2} 0 0 1 ${S - E} ${S - E / 2} V ${R} A ${R - E} ${R - E} 0 0 0 ${DROIT} ${E}
  H ${E / 2} A ${E / 2} ${E / 2} 0 0 1 ${E / 2} 0 Z`

// position du dégradé le long de la bande (projection sur la diagonale)
const offsetDe = (niveau) => {
  const [x, y] = pointA(distanceDe(niveau))
  return (x + y - E / 2) / (S - E / 2 + S - E / 2)
}

export default function ArcTheme() {
  const { niveau, changerNiveau } = useTheme()
  const svg = useRef(null)
  const [px, py] = pointA(distanceDe(niveau))
  const couleur = fondPourNiveau(niveau)

  // on cherche le point de la bande le plus proche du doigt / de la souris
  const depuisPointeur = (e) => {
    const zone = svg.current.getBoundingClientRect()
    const x = ((e.clientX - zone.left) / zone.width) * S
    const y = ((e.clientY - zone.top) / zone.height) * S
    let meilleur = 0, ecart = Infinity
    for (let d = 0; d <= TOTAL; d += 2) {
      const [a, b] = pointA(d)
      const e2 = (a - x) ** 2 + (b - y) ** 2
      if (e2 < ecart) { ecart = e2; meilleur = d }
    }
    changerNiveau(versNiveau(meilleur))
  }

  const clavier = (e) => {
    const pas = { ArrowRight: 0.05, ArrowDown: 0.05, ArrowLeft: -0.05, ArrowUp: -0.05 }[e.key]
    if (pas !== undefined) { e.preventDefault(); changerNiveau(Math.min(1, Math.max(0, niveau + pas))) }
    if (e.key === 'Home') changerNiveau(0)
    if (e.key === 'End') changerNiveau(1)
  }

  return (
    <div className="pointer-events-none fixed right-0 top-0 z-50" style={{ width: S, height: S }}>
      {/* verre dépoli uniforme, découpé exactement à la forme de la bande */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: `path('${contour.replace(/\s+/g, ' ')}')`,
          background: 'color-mix(in srgb, var(--surface) 35%, transparent)',
          backdropFilter: 'blur(14px) saturate(180%)',
          WebkitBackdropFilter: 'blur(14px) saturate(180%)',
        }}
      />

      <svg
        ref={svg}
        viewBox={`0 0 ${S} ${S}`}
        width={S}
        height={S}
        className="relative touch-none select-none outline-none focus-visible:drop-shadow-[0_0_6px_var(--color-jef-clair)]"
        role="slider"
        tabIndex={0}
        aria-label="Couleurs du site, du bleu nuit au clair"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(niveau * 100)}
        onKeyDown={clavier}
      >
        <defs>
          {/* le dégradé suit les mêmes étapes que les couleurs du site */}
          <linearGradient id="arc-degrade" gradientUnits="userSpaceOnUse" x1="0" y1={E / 2} x2={S - E / 2} y2={S}>
            {ETAPES.map((e) => <stop key={e.niveau} offset={offsetDe(e.niveau)} stopColor={e.couleur} />)}
          </linearGradient>
          <radialGradient id="arc-bulle" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity=".9" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity=".15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* zone qu'on peut attraper : seulement la bande */}
        <path d={contour} fill="transparent" className="pointer-events-auto cursor-pointer"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); depuisPointeur(e) }}
          onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) depuisPointeur(e) }} />

        {/* rail de couleur au milieu de la bande */}
        <path d={milieu} fill="none" stroke="url(#arc-degrade)" strokeWidth="5" strokeLinecap="round"
          className="pointer-events-none" />

        {/* bord du verre : une ombre fine puis un liseré clair, réguliers tout autour */}
        <path d={contour} fill="none" stroke="color-mix(in srgb, var(--texte) 14%, transparent)" strokeWidth="2.4"
          className="pointer-events-none" />
        <path d={contour} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1"
          className="pointer-events-none" />

        {/* poignée en bulle de verre, de la couleur actuelle du site */}
        <g className="pointer-events-none" style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.35))' }}>
          <circle cx={px} cy={py} r={E / 2 - 1} fill={couleur} stroke="rgba(255,255,255,.9)" strokeWidth="2" />
          <circle cx={px} cy={py} r={E / 2 - 2} fill="url(#arc-bulle)" />
        </g>
      </svg>
    </div>
  )
}