
export const TYPES = {
  RESERVATION: { libelle: 'Réservations', couleur: '#0174ab', ouvrir: 'Voir la réservation' },
  NOUVELLE_DEMANDE: { libelle: 'Demandes', couleur: '#7c3aed', ouvrir: 'Voir la demande' },
  MESSAGE: { libelle: 'Messages', couleur: '#0891b2', ouvrir: 'Ouvrir la conversation' },
  PAIEMENT: { libelle: 'Paiements', couleur: '#16a34a', ouvrir: 'Voir le paiement' },
  AVIS: { libelle: 'Avis', couleur: '#ca8a04', ouvrir: 'Voir mon profil' },
  PUBLICATION: { libelle: 'Publications', couleur: '#db2777', ouvrir: 'Voir la publication' },
  CERTIFICATION: { libelle: 'Certification', couleur: '#0e9f6e', ouvrir: 'Mon espace prestataire' },
  COMPTE: { libelle: 'Compte', couleur: '#475569', ouvrir: 'Mon compte' },
  PROFIL: { libelle: 'Profil', couleur: '#ea580c', ouvrir: 'Mon profil' },
}
export const infoType = (t) => TYPES[t] ?? { libelle: 'Autre', couleur: '#64748b', ouvrir: 'Ouvrir' }


export function lienFront(lien, user) {
  if (!lien) return null
  if (lien === '/profil') return '/espace?onglet=compte'
  if (lien === '/profil-pro') return '/espace-prestataire'
  if (lien === '/mes-publications') return user?.id ? `/prestataires/${user.id}` : '/fil'
  if (lien.startsWith('/messagerie/')) return lien.replace('/messagerie/', '/messages/')

  if (/^\/prestataires\/\d+$/.test(lien)) return user?.id ? `/prestataires/${user.id}` : '/fil'
 
  if (lien.startsWith('/publications/')) return user?.est_prestataire && user?.id ? `/prestataires/${user.id}` : '/fil'
  return lien
}


export function groupeDe(iso) {
  const d = new Date(iso)
  const debut = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const jours = Math.round((debut(new Date()) - debut(d)) / 86400000)
  if (jours <= 0) return "Aujourd'hui"
  if (jours === 1) return 'Hier'
  if (jours < 7) return 'Cette semaine'
  if (jours < 31) return 'Ce mois-ci'
  return 'Plus ancien'
}


export function heureCourte(iso) {
  const d = new Date(iso)
  const g = groupeDe(iso)
  if (g === "Aujourd'hui") return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (g === 'Hier') return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export const dateLongue = (iso) => new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })