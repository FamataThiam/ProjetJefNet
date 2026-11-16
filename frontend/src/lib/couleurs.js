// Palette continue de JefNet : niveau 0 = bleu nuit profond, niveau 1 = clair.
// Entre les deux, toutes les nuances de bleu sont calculées.
export const ETAPES = [
  { niveau: 0, couleur: '#030b1a' },    // bleu nuit
  { niveau: 0.25, couleur: '#06294a' }, // bleu profond
  { niveau: 0.5, couleur: '#0b4f7f' },  // bleu JefNet foncé
  { niveau: 0.75, couleur: '#9fd2ef' }, // bleu ciel
  { niveau: 1, couleur: '#f8fafc' },    // clair
]

const TEXTE_CLAIR = '#eef4fb'
const TEXTE_FONCE = '#0f172a'

const versRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const versHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

// mélange deux couleurs : p = 0 → a, p = 1 → b
export function melanger(a, b, p) {
  const [x, y] = [versRgb(a), versRgb(b)]
  return versHex(x.map((v, i) => v + (y[i] - v) * p))
}

function luminance(hex) {
  const [r, g, b] = versRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

// couleur du fond pour un niveau donné (interpolation entre les étapes)
export function fondPourNiveau(niveau) {
  const n = Math.min(1, Math.max(0, niveau))
  for (let i = 0; i < ETAPES.length - 1; i++) {
    const [a, b] = [ETAPES[i], ETAPES[i + 1]]
    if (n <= b.niveau) return melanger(a.couleur, b.couleur, (n - a.niveau) / (b.niveau - a.niveau))
  }
  return ETAPES[ETAPES.length - 1].couleur
}

// toutes les couleurs du site pour un niveau ; le texte reste toujours lisible
export function paletteDepuisNiveau(niveau) {
  const fond = fondPourNiveau(niveau)
  const sombre = contraste(fond, TEXTE_CLAIR) >= contraste(fond, TEXTE_FONCE)
  const texte = sombre ? TEXTE_CLAIR : TEXTE_FONCE
  return {
    sombre,
    variables: {
      '--fond': fond,
      '--surface': sombre ? melanger(fond, '#ffffff', 0.06) : melanger(fond, '#ffffff', 0.7),
      '--surface-2': sombre ? melanger(fond, '#ffffff', 0.11) : melanger(fond, TEXTE_FONCE, 0.04),
      '--texte': texte,
      '--texte-doux': melanger(texte, fond, 0.38),
      '--bordure': melanger(texte, fond, 0.84),
    },
  }
}