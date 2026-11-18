

export const initiales = (prenom = '', nom = '') => `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()

export const prix = (n) => `${new Intl.NumberFormat('fr-FR').format(n).replace(/ | /g, ' ')} FCFA`

export const virgule = (n) => Number(n).toFixed(1).replace('.', ',')


export function duree(minutes) {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} min`
  if (minutes < 1440) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
  }
  const j = Math.round(minutes / 1440)
  return `${j} jour${j > 1 ? 's' : ''}`
}

export const moisAnnee = (date) =>
  date ? new Date(date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : ''

export const dateLongue = (date) =>
  date ? new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

// codes du back → texte
const ZONES = {
  LOCALITE: 'Dans sa localité',
  VILLE: 'Dans sa ville',
  REGION: 'Dans sa région',
  PAYS: 'Partout au Sénégal',
}
export const zone = (code) => ZONES[code] ?? code ?? ''

// moins de 24 h ?
export const recente = (date) => date && Date.now() - new Date(date).getTime() < 24 * 3600 * 1000

// « il y a 3 h » pour un statut
export function ilYA(date) {
  const h = Math.floor((Date.now() - new Date(date).getTime()) / 3600000)
  return h < 1 ? "il y a moins d'1 h" : `il y a ${h} h`
}

// photos et vidéos d'une publication, dans l'ordre
export const medias = (pub) => [...(pub.medias ?? [])].sort((a, b) => a.ordre - b.ordre)