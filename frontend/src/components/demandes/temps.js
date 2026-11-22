const JOUR = 24 * 60 * 60 * 1000
export const DUREE_VALIDITE_JOURS = 7


export function joursRestants(expireLe) {
  if (!expireLe) return null
  return Math.max(0, Math.ceil((new Date(expireLe) - Date.now()) / JOUR))
}


export function texteExpiration(expireLe) {
  const j = joursRestants(expireLe)
  if (j === null) return ''
  if (j === 0) return 'aujourd’hui'
  return `dans ${j} jour${j > 1 ? 's' : ''}`
}

// part du délai qui reste, pour la jauge (100 = tout neuf)
export function partRestante(expireLe) {
  if (!expireLe) return 0
  return Math.max(0, Math.min(100, ((new Date(expireLe) - Date.now()) / (DUREE_VALIDITE_JOURS * JOUR)) * 100))
}

// « À l'instant », « Il y a 2 h », « Hier », « Il y a 3 jours », « 12 nov. »
export function ilYa(iso) {
  const ecart = Date.now() - new Date(iso)
  const min = Math.floor(ecart / 60000)
  if (min < 1) return 'À l’instant'
  if (min < 60) return `Il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Il y a ${h} h`
  const j = Math.floor(h / 24)
  if (j === 1) return 'Hier'
  if (j < 7) return `Il y a ${j} jours`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// 2.4 → « à 2,4 km »
export const distance = (km) => (km === null || km === undefined ? '' : `à ${String(km).replace('.', ',')} km`)