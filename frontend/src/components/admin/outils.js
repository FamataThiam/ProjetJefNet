

export const NIVEAUX = { SUPER_ADMIN: 'Super administrateur', ADMIN: 'Administrateur', MODERATEUR: 'Modérateur' }


export function droitsDe(user) {
  const n = user?.niveau_acces
  return { decider: n === 'SUPER_ADMIN' || n === 'ADMIN', superAdmin: n === 'SUPER_ADMIN' }
}

export const dateCourte = (iso) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

export function ilYa(iso) {
  if (!iso) return 'jamais'
  const j = Math.floor((Date.now() - new Date(iso)) / 864e5)
  if (j < 1) return 'aujourd’hui'
  if (j === 1) return 'hier'
  if (j < 30) return `il y a ${j} jours`
  return dateCourte(iso)
}