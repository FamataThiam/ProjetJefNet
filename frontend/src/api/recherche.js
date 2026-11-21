import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import api from './client'


export function useRechercheRapide(texte) {
  const q = texte.trim()
  return useQuery({
    queryKey: ['recherche', q],
    queryFn: () => api.get('/prestataires', { params: { q, tri: 'note' } }).then((r) => r.data),
    enabled: q.length >= 2,
    staleTime: 60 * 1000,
    placeholderData: (precedent) => precedent,
  })
}


export function useListePrestataires({ domaine, q, tri = 'note', certifie, ville }) {
  return useInfiniteQuery({
    queryKey: ['prestataires', 'liste', domaine, q, tri, certifie, ville],
    queryFn: ({ pageParam }) => api.get('/prestataires', {
      params: { domaine: domaine || undefined, q: q || undefined, tri, certifie: certifie ? 1 : undefined, ville: ville || undefined, page: pageParam },
    }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (d) => (d.meta.current_page < d.meta.last_page ? d.meta.current_page + 1 : undefined),
  })
}


export function useNombreCertifies(domaine) {
  return useQuery({
    queryKey: ['prestataires', 'certifies', domaine],
    queryFn: () => api.get('/prestataires', { params: { domaine, certifie: 1 } }).then((r) => r.data.meta.total),
    enabled: Boolean(domaine),
    staleTime: 5 * 60 * 1000,
  })
}