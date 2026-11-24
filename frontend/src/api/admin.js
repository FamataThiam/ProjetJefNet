import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from './client'

const pageSuivante = (p) => (p.meta && p.meta.current_page < p.meta.last_page ? p.meta.current_page + 1 : undefined)

// liste paginée de l'administration (« Voir plus »)
function useListeAdmin(cle, url, params) {
  return useInfiniteQuery({
    queryKey: ['admin', cle, params],
    queryFn: ({ pageParam }) => api.get(url, { params: { ...params, page: pageParam } }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: pageSuivante,
  })
}

// après une décision : la liste concernée, le tableau de bord et le compteur du menu sont rechargés
function useRafraichir(...cles) {
  const client = useQueryClient()
  return () => {
    cles.forEach((c) => client.invalidateQueries({ queryKey: ['admin', c] }))
    client.invalidateQueries({ queryKey: ['admin', 'tableau'] })
  }
}

// ================= tableau de bord =================
// partie : resume | evolution | repartitions | marche | a-traiter
export function useTableauAdmin(partie, params) {
  return useQuery({
    queryKey: ['admin', 'tableau', partie, params ?? null],
    queryFn: () => api.get(`/admin/tableau-de-bord/${partie}`, { params }).then((r) => r.data.data),
    staleTime: 60 * 1000,
  })
}

// ================= certifications =================
export const useCertifications = (statut) => useListeAdmin('certifications', '/admin/certifications', { statut })

// nombre de demandes en attente (badge du menu)
export function useCertifsEnAttente() {
  return useQuery({
    queryKey: ['admin', 'certifications', 'compte'],
    queryFn: () => api.get('/admin/certifications', { params: { statut: 'EN_ATTENTE' } }).then((r) => r.data.meta?.total ?? r.data.data.length),
    staleTime: 30 * 1000,
  })
}

// lien signé (10 min) vers le justificatif : il s'ouvre sans jeton, donc dans un <iframe> ou un nouvel onglet
export function useLienJustificatif(id, actif) {
  return useQuery({
    queryKey: ['admin', 'justificatif', id],
    queryFn: () => api.get(`/admin/certifications/${id}/justificatif`).then((r) => r.data.data),
    enabled: Boolean(id && actif),
    staleTime: 8 * 60 * 1000,
    retry: false,
  })
}

// PATCH /admin/certifications/{id}/valider | refuser | retirer ({ motif } pour refuser et retirer)
export function useDecisionCertification() {
  const rafraichir = useRafraichir('certifications', 'membres')
  return useMutation({
    mutationFn: ({ id, action, motif }) => api.patch(`/admin/certifications/${id}/${action}`, motif ? { motif } : {}).then((r) => r.data),
    onSuccess: rafraichir,
  })
}

// ================= membres =================
export const useMembresAdmin = (filtres) => useListeAdmin('membres', '/admin/membres', filtres)

export function useMembreAdmin(id) {
  return useQuery({
    queryKey: ['admin', 'membres', 'detail', id],
    queryFn: () => api.get(`/admin/membres/${id}`).then((r) => ({ ...r.data.data, statistiques: r.data.statistiques })),
    enabled: Boolean(id),
  })
}

// PATCH /admin/membres/{id}/suspendre { motif } | reactiver
export function useActionMembre() {
  const rafraichir = useRafraichir('membres')
  return useMutation({
    mutationFn: ({ id, action, motif }) => api.patch(`/admin/membres/${id}/${action}`, motif ? { motif } : {}).then((r) => r.data),
    onSuccess: rafraichir,
  })
}

// ================= modération =================
export const usePublicationsAdmin = (etat) => useListeAdmin('publications', '/admin/publications', { etat })

export function useCommentairesAdmin(publicationId) {
  return useQuery({
    queryKey: ['admin', 'commentaires', publicationId],
    queryFn: () => api.get(`/publications/${publicationId}/commentaires`).then((r) => r.data.data),
    enabled: Boolean(publicationId),
  })
}

// PATCH /admin/publications/{id}/masquer { motif } | reafficher
export function useModerer() {
  const rafraichir = useRafraichir('publications')
  return useMutation({
    mutationFn: ({ id, action, motif }) => api.patch(`/admin/publications/${id}/${action}`, motif ? { motif } : {}).then((r) => r.data),
    onSuccess: rafraichir,
  })
}

// DELETE /admin/commentaires/{id}
export function useSupprimerCommentaire() {
  const rafraichir = useRafraichir('commentaires', 'publications')
  return useMutation({
    mutationFn: (id) => api.delete(`/admin/commentaires/${id}`).then((r) => r.data),
    onSuccess: rafraichir,
  })
}

// ================= domaines =================
export function useDomainesAdmin(etat, recherche) {
  return useQuery({
    queryKey: ['admin', 'domaines', etat, recherche],
    queryFn: () => api.get('/admin/domaines', { params: { etat: etat || undefined, recherche: recherche || undefined } }).then((r) => r.data.data),
  })
}

// POST /admin/domaines ou /admin/domaines/{id}/modifier (multipart : libelle, description, image, supprimer_image)
export function useEnregistrerDomaine() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, libelle, description, image, supprimerImage }) => {
      const d = new FormData()
      d.append('libelle', libelle)
      d.append('description', description ?? '')
      if (image) d.append('image', image)
      if (supprimerImage) d.append('supprimer_image', '1')
      return api.post(id ? `/admin/domaines/${id}/modifier` : '/admin/domaines', d).then((r) => r.data)
    },
    onSuccess: () => { client.invalidateQueries({ queryKey: ['admin', 'domaines'] }); client.invalidateQueries({ queryKey: ['domaines'] }) },
  })
}

// PATCH /admin/domaines/{id}/activer | desactiver
export function useEtatDomaine() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }) => api.patch(`/admin/domaines/${id}/${action}`).then((r) => r.data),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['admin', 'domaines'] }); client.invalidateQueries({ queryKey: ['domaines'] }) },
  })
}

// ================= listes de valeurs =================
export function useTypesCodeList() {
  return useQuery({
    queryKey: ['admin', 'code-lists', 'types'],
    queryFn: () => api.get('/admin/code-lists/types').then((r) => r.data.data),
  })
}

export function useValeursCodeList(type) {
  return useQuery({
    queryKey: ['admin', 'code-lists', type],
    queryFn: () => api.get('/admin/code-lists', { params: { type } }).then((r) => r.data.data),
    enabled: Boolean(type),
  })
}

// POST /admin/code-lists { type, valeur, description } · PATCH /admin/code-lists/{id}/activer | desactiver
export function useActionCodeList() {
  const rafraichir = useRafraichir('code-lists')
  return useMutation({
    mutationFn: ({ id, action, ...donnees }) => (action === 'ajouter'
      ? api.post('/admin/code-lists', donnees)
      : api.patch(`/admin/code-lists/${id}/${action}`)).then((r) => r.data),
    onSuccess: rafraichir,
  })
}