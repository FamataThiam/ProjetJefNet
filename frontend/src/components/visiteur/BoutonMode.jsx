import useMode from '../../hooks/useMode'

const NUAGES = [
  // [largeur, hauteur, gauche, haut, foncé ?] en % du ciel
  [42, 62, 52, 46, true], [34, 58, 76, 30, true],
  [40, 56, 40, 66, false], [36, 60, 66, 58, false], [30, 50, 86, 52, false],
]
const ETOILES = [[12, 28], [22, 62], [34, 22], [44, 70], [30, 48], [52, 38], [18, 82], [58, 16]]
const CRATERES = [[24, 55, 16], [34, 16, 40], [20, 62, 62]] // [taille, gauche, haut]

// Bouton clair / sombre : soleil sur ciel bleu ↔ lune sur ciel étoilé, contour en verre
export default function BoutonMode({ className = '' }) {
  const { sombre, basculer } = useMode()

  return (
    <button type="button" onClick={basculer} role="switch" aria-checked={sombre}
      aria-label={sombre ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className={`bouton-mode ${sombre ? 'nuit' : ''} ${className}`}>
      <span className="ciel">
        {[0.32, 0.55, 0.8].map((r) => (
          <span key={r} className="anneau" style={{ width: `${r * 260}%`, paddingTop: `${r * 260}%` }} />
        ))}
        {NUAGES.map(([l, h, x, y, fonce], i) => (
          <span key={i} className={`nuage ${fonce ? 'fonce' : ''}`}
            style={{ width: `${l}%`, height: `${h}%`, left: `${x}%`, top: `${y}%` }} />
        ))}
        {ETOILES.map(([x, y], i) => (
          <span key={i} className="etoile" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.4}s` }} />
        ))}
      </span>
      <span className="astre">
        {CRATERES.map(([t, x, y], i) => (
          <span key={i} className="cratere" style={{ width: `${t}%`, height: `${t}%`, left: `${x}%`, top: `${y}%` }} />
        ))}
      </span>
    </button>
  )
}