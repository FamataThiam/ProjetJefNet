

export const ETAPES = ['Mon métier', 'Mes services', 'Ma zone', 'Vérification']


export const EXPERIENCES = ["Moins d'1 an", '1 à 3 ans', '3 à 5 ans', '5 à 10 ans', 'Plus de 10 ans']


export const UNITES = { forfait: 'le forfait', heure: "l'heure", jour: 'la journée', m2: 'le m²', piece: 'la pièce' }


export const DUREES = [
  { valeur: 30, libelle: '30 min' },
  { valeur: 60, libelle: '1 h' },
  { valeur: 120, libelle: '2 h' },
  { valeur: 240, libelle: 'Demi-journée' },
  { valeur: 480, libelle: 'Journée' },
  { valeur: 1440, libelle: 'Plusieurs jours' },
]


export const RAYONS = {
  LOCALITE: { libelle: 'Mon quartier', km: 3 },
  VILLE: { libelle: 'Ma ville', km: 15 },
  REGION: { libelle: 'Ma région', km: 60 },
  PAYS: { libelle: 'Tout le Sénégal', km: null },
}

export const serviceVide = (domaine_id = '') => ({ domaine_id, nom: '', prix: '', unite_tarif: 'forfait', duree: 60, description: '' })

export const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`


export const dansLeSenegal = (lat, lng) => lat >= 12 && lat <= 17 && lng >= -18 && lng <= -11



const urlValide = (v, https) => {
  try {
    const u = new URL(v)
    return https ? u.protocol === 'https:' : ['http:', 'https:'].includes(u.protocol)
  } catch { return false }
}

export function verifierMetier(m) {
  const e = {}
  if (!m.titre_professionnel.trim()) e.titre_professionnel = 'Indique ton métier.'
  else if (m.titre_professionnel.length > 100) e.titre_professionnel = '100 caractères au maximum.'
  if (m.linkedin && !urlValide(m.linkedin, true)) e.linkedin = 'Lien LinkedIn invalide (il doit commencer par https://).'
  if (m.portfolio && !urlValide(m.portfolio, false)) e.portfolio = 'Lien invalide (il doit commencer par http:// ou https://).'
  return e
}

export function verifierServices(services) {
  return services.map((s) => {
    const e = {}
    if (!s.domaine_id) e.domaine_id = 'Choisis un domaine.'
    if (!s.nom.trim()) e.nom = 'Donne un nom au service.'
    if (s.prix === '' || Number.isNaN(Number(s.prix))) e.prix = 'Indique un prix.'
    return e
  })
}

export function verifierZone(z) {
  const e = {}
  if (!z.rayon) e.rayon = "Choisis jusqu'où tu te déplaces."
  if (!z.position) e.position = 'Place-toi sur la carte.'
  return e
}

export const vide = (e) => Object.keys(e).length === 0