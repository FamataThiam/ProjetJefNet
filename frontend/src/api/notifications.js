import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'


export function useNotifications({ etat, type, q }) {
  return useInfiniteQuery({
    queryKey: ['notifications', { etat, type, q }],
    queryFn: ({ pageParam }) => api.get('/notifications', {
      params: { page: pageParam, etat: etat === 'toutes' ? undefined : etat, type: type || undefined, q: q || undefined },
    }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (p) => (p.meta.current_page < p.meta.last_page ? p.meta.current_page + 1 : undefined),
  })
}



function useChangement(envoyer, appliquer) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: envoyer,
    onMutate: async (variables) => {
      await client.cancelQueries({ queryKey: ['notifications'] })
      const avant = client.getQueriesData({ queryKey: ['notifications'] })
      const badge = client.getQueryData(['non-lues', 'notifications'])
      const changees = new Map() // id → nouvel état (chaque notification comptée une seule fois)

      client.setQueriesData({ queryKey: ['notifications'] }, (donnees) => {
        if (!donnees?.pages) return donnees
        return {
          ...donnees,
          pages: donnees.pages.map((page) => ({
            ...page,
            data: page.data.map((n) => {
              const est_lu = appliquer(n, variables)
              if (est_lu === n.est_lu) return n
              changees.set(n.id, est_lu)
              return { ...n, est_lu }
            }),
          })),
        }
      })

    
      const ecart = [...changees.values()].reduce((t, lu) => t + (lu ? -1 : 1), 0)
      if (typeof badge === 'number') client.setQueryData(['non-lues', 'notifications'], Math.max(0, badge + ecart))
      return { avant, badge }
    },
    onError: (_e, _v, ctx) => {
      ctx?.avant.forEach(([cle, donnees]) => client.setQueryData(cle, donnees))
      if (ctx?.badge !== undefined) client.setQueryData(['non-lues', 'notifications'], ctx.badge)
    },
    onSuccess: (r) => {
      if (typeof r?.non_lues === 'number') client.setQueryData(['non-lues', 'notifications'], r.non_lues)
    },

    onSettled: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export const useMarquerLue = () => useChangement(
  (id) => api.patch(`/notifications/${id}/lue`).then((r) => r.data),
  (n, id) => (n.id === id ? true : n.est_lu),
)

export const useMarquerNonLue = () => useChangement(
  (id) => api.patch(`/notifications/${id}/non-lue`).then((r) => r.data),
  (n, id) => (n.id === id ? false : n.est_lu),
)

export const useLirePlusieurs = () => useChangement(
  (ids) => api.patch('/notifications/lire', { ids }).then((r) => r.data),
  (n, ids) => (ids.includes(n.id) ? true : n.est_lu),
)

export const useToutLire = () => useChangement(
  () => api.patch('/notifications/tout-lire').then((r) => r.data),
  () => true,
)