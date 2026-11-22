
export const STATUTS = {
  EN_ATTENTE: { libelle: 'En attente', classe: 'att', onglet: 'En attente' },
  CONFIRMEE: { libelle: 'Confirmée', classe: 'conf', onglet: 'Confirmées' },
  EN_COURS: { libelle: 'En cours', classe: 'cours', onglet: 'En cours' },
  TERMINEE: { libelle: 'Terminée', classe: 'fini', onglet: 'Terminées' },
  ANNULEE: { libelle: 'Annulée', classe: 'ann', onglet: 'Annulées' },
  REFUSEE: { libelle: 'Refusée', classe: 'ref', onglet: 'Refusées' },
}

export const fcfa = (n) => `${new Intl.NumberFormat('fr-FR').format(n ?? 0).replace(/[\u202f\u00a0]/g, ' ')} F`


export const jourDe = (iso) => new Date(`${iso}T12:00:00`)

export const jourCourt = (iso) => jourDe(iso).toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')
export const numeroJour = (iso) => jourDe(iso).getDate()
export const moisCourt = (iso) => jourDe(iso).toLocaleDateString('fr-FR', { month: 'short' })
const majuscule = (t) => t.charAt(0).toUpperCase() + t.slice(1)

export const dateLongue = (iso) => majuscule(jourDe(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))
export const dateSimple = (iso) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '')
export const dateHeure = (iso) => (iso ? new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '')


export const titreServices = (services = []) =>
  services.length ? `${services[0].nom}${services.length > 1 ? ` + ${services.length - 1}` : ''}` : 'Réservation'


export function resteAFaire(r) {
  if (r.statut !== 'TERMINEE') return null
  const client = r.mon_role === 'CLIENT'
  const rapportSigne = r.rapport?.statut === 'SIGNE'
  const paye = r.paiement?.statut === 'PAYEE'
  const especes = r.paiement?.statut === 'EN_ATTENTE'

  if (!r.rapport) return client ? { texte: 'Rapport en préparation', fait: false, attente: true } : { texte: 'Rapport à rédiger', fait: false }
  if (client) {
    if (!rapportSigne) return { texte: 'Rapport à signer', fait: false }
    if (!paye && !especes) return { texte: 'À payer', fait: false }
    if (!r.avis) return { texte: 'Avis à laisser', fait: false }
  } else {
    if (especes) return { texte: 'Espèces à confirmer', fait: false }
    if (!rapportSigne) return { texte: 'Signature du client attendue', fait: false, attente: true }
    if (!paye) return { texte: 'Paiement attendu', fait: false, attente: true }
  }
  return { texte: paye && rapportSigne ? 'Payée · rapport signé' : 'Clôturée', fait: true }
}

// créneaux d'une heure dans une plage de disponibilité (08:00–14:00 → 08:00 … 13:00)
export function creneauxDe(dispo) {
  const enMinutes = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b }
  const debut = enMinutes(dispo.heure_debut)
  const fin = enMinutes(dispo.heure_fin)
  const maintenant = new Date()
  const estAujourdhui = jourDe(dispo.jour).toDateString() === maintenant.toDateString()
  const liste = []
  for (let m = debut; m + 60 <= fin; m += 60) {
    if (estAujourdhui && m <= maintenant.getHours() * 60 + maintenant.getMinutes()) continue
    liste.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
  }
  return liste
}