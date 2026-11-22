import { useEffect, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from './client'

const pageSuivante = (p) => (p.meta.current_page < p.meta.last_page ? p.meta.current_page + 1 : undefined)

// après chaque action : la réservation, les listes et le résumé de l'espace client sont rechargés
function useRafraichir(uuid) {
  const client = useQueryClient()
  return () => {
    client.invalidateQueries({ queryKey: ['reservation', uuid] })
    client.invalidateQueries({ queryKey: ['reservations'] })
    client.invalidateQueries({ queryKey: ['espace', 'resume'] })
  }
}

// GET /reservations (faites) ou /profil-pro/reservations (reçues), filtrées par statut
// chaque page contient aussi « compteurs » : { EN_ATTENTE: 2, TERMINEE: 4, ... }
export function useReservations(vue, statut) {
  const url = vue === 'recues' ? '/profil-pro/reservations' : '/reservations'
  return useInfiniteQuery({
    queryKey: ['reservations', vue, statut],
    queryFn: ({ pageParam }) => api.get(url, { params: { page: pageParam, statut: statut || undefined } }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: pageSuivante,
  })
}

// GET /reservations/{uuid}
export function useReservation(uuid) {
  return useQuery({
    queryKey: ['reservation', uuid],
    queryFn: () => api.get(`/reservations/${uuid}`).then((r) => r.data.data),
    enabled: Boolean(uuid),
  })
}

// POST /reservations
export function useReserver() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (donnees) => api.post('/reservations', donnees).then((r) => r.data.data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['reservations'] })
      client.invalidateQueries({ queryKey: ['espace', 'resume'] })
    },
  })
}

// PATCH /reservations/{uuid}/{confirmer|refuser|demarrer|terminer|annuler}
export function useActionReservation(uuid) {
  const rafraichir = useRafraichir(uuid)
  return useMutation({
    mutationFn: ({ action, raison }) => api.patch(`/reservations/${uuid}/${action}`, raison ? { raison } : {}).then((r) => r.data),
    onSuccess: rafraichir,
  })
}

// ---------- rapport de prestation ----------

// GET /reservations/{uuid}/rapport (404 tant qu'il n'est pas rédigé)
export function useRapport(uuid, actif) {
  return useQuery({
    queryKey: ['reservation', uuid, 'rapport'],
    queryFn: () => api.get(`/reservations/${uuid}/rapport`).then((r) => r.data.data),
    enabled: Boolean(uuid && actif),
    retry: false,
  })
}

// POST /reservations/{uuid}/rapport (rédiger) ou /rapport/modifier, en multipart (photos)
export function useEcrireRapport(uuid, modifier) {
  const rafraichir = useRafraichir(uuid)
  return useMutation({
    mutationFn: (champs) => {
      const donnees = new FormData()
      Object.entries(champs).forEach(([cle, valeur]) => { if (valeur !== null && valeur !== undefined) donnees.append(cle, valeur) })
      return api.post(`/reservations/${uuid}/rapport${modifier ? '/modifier' : ''}`, donnees).then((r) => r.data)
    },
    onSuccess: rafraichir,
  })
}

// PATCH /reservations/{uuid}/rapport/signer (client) — signature facultative si déjà enregistrée dans le profil
export function useSignerRapport(uuid) {
  const rafraichir = useRafraichir(uuid)
  const client = useQueryClient()
  return useMutation({
    mutationFn: (signature) => api.patch(`/reservations/${uuid}/rapport/signer`, signature ? { signature } : {}).then((r) => r.data),
    onSuccess: () => { rafraichir(); client.invalidateQueries({ queryKey: ['moi'] }) },
  })
}

// ---------- paiement ----------

// GET /reservations/{uuid}/paiement : historique des paiements (avec la facture quand elle existe)
export function usePaiements(uuid, actif) {
  return useQuery({
    queryKey: ['reservation', uuid, 'paiements'],
    queryFn: () => api.get(`/reservations/${uuid}/paiement`).then((r) => r.data.data),
    enabled: Boolean(uuid && actif),
  })
}

// POST /reservations/{uuid}/paiement { mode, operateur?, telephone? }
export function usePayer(uuid) {
  const rafraichir = useRafraichir(uuid)
  return useMutation({
    mutationFn: (donnees) => api.post(`/reservations/${uuid}/paiement`, donnees).then((r) => r.data),
    onSuccess: rafraichir,
  })
}

// PATCH /reservations/{uuid}/paiement/confirmer (prestataire, paiement en espèces)
export function useConfirmerEspeces(uuid) {
  const rafraichir = useRafraichir(uuid)
  return useMutation({
    mutationFn: () => api.patch(`/reservations/${uuid}/paiement/confirmer`).then((r) => r.data),
    onSuccess: rafraichir,
  })
}

// ---------- avis ----------

export function useAvis(uuid, actif) {
  return useQuery({
    queryKey: ['reservation', uuid, 'avis'],
    queryFn: () => api.get(`/reservations/${uuid}/avis`).then((r) => r.data.data),
    enabled: Boolean(uuid && actif),
    retry: false,
  })
}

// POST (laisser) ou PATCH (modifier, 7 jours) /reservations/{uuid}/avis
export function useEcrireAvis(uuid, modifier) {
  const rafraichir = useRafraichir(uuid)
  return useMutation({
    mutationFn: (donnees) => (modifier ? api.patch : api.post)(`/reservations/${uuid}/avis`, donnees).then((r) => r.data),
    onSuccess: rafraichir,
  })
}

// ---------- fichiers protégés (il faut le jeton : on passe par axios) ----------
// les chemins sont relatifs à l'API (ex. /reservations/{uuid}/facture) : ils suivent VITE_API_URL

// télécharge un PDF (rapport ou facture) et l'enregistre sur l'appareil
export async function telecharger(chemin, nom) {
  const r = await api.get(chemin, { responseType: 'blob' })
  const lien = document.createElement('a')
  lien.href = URL.createObjectURL(r.data)
  lien.download = nom
  lien.click()
  setTimeout(() => URL.revokeObjectURL(lien.href), 2000)
}

// affiche une photo du rapport : renvoie une adresse locale (blob) utilisable dans <img>
export function useImageProtegee(chemin) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    if (!chemin) return undefined
    let adresse = null
    let annule = false
    api.get(chemin, { responseType: 'blob' }).then((r) => {
      if (annule) return
      adresse = URL.createObjectURL(r.data)
      setSrc(adresse)
    }).catch(() => {})
    return () => { annule = true; if (adresse) URL.revokeObjectURL(adresse); setSrc(null) }
  }, [chemin])
  return src
}