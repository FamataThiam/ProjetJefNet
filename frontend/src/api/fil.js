import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import api from './client'

const pageSuivante = (d) => (d.meta && d.meta.current_page < d.meta.last_page ? d.meta.current_page + 1 : undefined)


export function useFil(onglet, position) {
  return useInfiniteQuery({
    queryKey: ['fil', onglet, position?.lat, position?.lng],
    queryFn: ({ pageParam }) => api.get('/fil', {
      params: { onglet, page: pageParam, lat: position?.lat, lng: position?.lng },
    }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: pageSuivante,
    staleTime: 60 * 1000,
  })
}


export function usePremierDuFil(onglet, actif) {
  return useQuery({
    queryKey: ['fil-veille', onglet],
    queryFn: () => api.get('/fil', { params: { onglet, page: 1 } }).then((r) => r.data.data[0]?.id ?? null),
    refetchInterval: 60 * 1000,
    enabled: actif,
  })
}


export function useStories() {
  return useQuery({
    queryKey: ['stories'],
    queryFn: () => api.get('/fil/stories').then((r) => r.data.data),
    staleTime: 60 * 1000,
  })
}


export function useRecommandations() {
  return useQuery({
    queryKey: ['recommandations'],
    queryFn: () => api.get('/recommandations').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
}


export function useNonLus() {
  const notifications = useQuery({
    queryKey: ['non-lues', 'notifications'],
    queryFn: () => api.get('/notifications/non-lues').then((r) => r.data.non_lues ?? 0),
    refetchInterval: 30 * 1000,
  })
  const messages = useQuery({
    queryKey: ['non-lus', 'messages'],
    queryFn: () => api.get('/conversations/non-lus').then((r) => r.data.non_lus ?? r.data.non_lues ?? r.data.total ?? 0),
    refetchInterval: 30 * 1000,
  })
  return { notifications: notifications.data ?? 0, messages: messages.data ?? 0 }
}


export function useChiffresClient(actif) {
  const total = (r) => r.data.meta?.total ?? r.data.data?.length ?? 0
  const reservations = useQuery({ queryKey: ['total', 'reservations'], queryFn: () => api.get('/reservations').then(total), enabled: actif, staleTime: 60 * 1000 })
  const demandes = useQuery({ queryKey: ['total', 'demandes'], queryFn: () => api.get('/demandes').then(total), enabled: actif, staleTime: 60 * 1000 })
  return { reservations: reservations.data, demandes: demandes.data }
}