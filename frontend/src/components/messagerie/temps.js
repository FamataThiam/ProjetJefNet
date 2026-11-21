
const jourDe = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const ecartJours = (iso) => Math.round((jourDe(new Date()) - jourDe(new Date(iso))) / 86400000)


export function heureListe(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const j = ecartJours(iso)
  if (j <= 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (j === 1) return 'Hier'
  if (j < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' })
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}


export function libelleJour(iso) {
  const j = ecartJours(iso)
  if (j <= 0) return "Aujourd'hui"
  if (j === 1) return 'Hier'
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', ...(d.getFullYear() !== new Date().getFullYear() && { year: 'numeric' }) })
}

export const memeJour = (a, b) => jourDe(new Date(a)) === jourDe(new Date(b))

export const duree = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00')