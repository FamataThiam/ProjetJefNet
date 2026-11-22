import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from './client'

const pageSuivante = (p) => (p.meta.current_page < p.meta.last_page ? p.meta.current_page + 1 : undefined)



// GET /demandes?statut=… (chaque page contient aussi « compteurs » par statut)
export function useMesDemandes(statut) {
  return useInfiniteQuery({
    queryKey: ['demandes', 'miennes', statut],
    queryFn: ({ pageParam }) => api.get('/demandes', { params: { page: pageParam, statut: statut || undefined } }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: pageSuivante,
  })
}

// GET /demandes/{uuid} (pour « Republier » une demande expirée ou annulée)
export function useMaDemande(uuid) {
  return useQuery({
    queryKey: ['demande', uuid],
    queryFn: () => api.get(`/demandes/${uuid}`).then((r) => r.data.data),
    enabled: Boolean(uuid),
  })
}

// POST /demandes
export function usePublierDemande() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (donnees) => api.post('/demandes', donnees).then((r) => r.data.data),
    onSuccess: () => client.invalidateQueries({ queryKey: ['demandes'] }),
  })
}

// PATCH /demandes/{uuid}/annuler
export function useAnnulerDemande() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (uuid) => api.patch(`/demandes/${uuid}/annuler`).then((r) => r.data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['demandes'] })
      client.invalidateQueries({ queryKey: ['espace', 'resume'] })
    },
  })
}



// GET /profil-pro/demandes : demandes de ses domaines, dans sa zone, les plus proches d'abord
export function useDemandesAPrendre(actif = true) {
  return useInfiniteQuery({
    queryKey: ['demandes', 'a-prendre'],
    queryFn: ({ pageParam }) => api.get('/profil-pro/demandes', { params: { page: pageParam } }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: pageSuivante,
    enabled: actif,
  })
}

// GET /profil-pro/services : ses services (pour choisir celui qui répond à la demande)
export function useMesServices(actif = true) {
  return useQuery({
    queryKey: ['profil-pro', 'services'],
    queryFn: () => api.get('/profil-pro/services').then((r) => r.data.data),
    enabled: actif,
  })
}

// POST /profil-pro/demandes/{uuid}/accepter { service_id, date_prevue, heure_prevue, prix_final }
export function useAccepterDemande(uuid) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (donnees) => api.post(`/profil-pro/demandes/${uuid}/accepter`, donnees).then((r) => r.data.data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['demandes'] })
      client.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}