import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'

const cle = (publicationId) => ['commentaires', publicationId]

// Commentaires d'une publication, 10 par page (avec leurs réponses)
export function useCommentaires(publicationId, actif) {
  return useInfiniteQuery({
    queryKey: cle(publicationId),
    queryFn: ({ pageParam }) => api.get(`/publications/${publicationId}/commentaires`, { params: { page: pageParam } }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (d) => (d.meta.current_page < d.meta.last_page ? d.meta.current_page + 1 : undefined),
    enabled: actif,
    staleTime: 30 * 1000,
  })
}

// modifie la liste en cache sans tout recharger
function modifierCache(client, publicationId, transformer) {
  client.setQueryData(cle(publicationId), (d) => (d ? { ...d, pages: d.pages.map((p, i) => ({ ...p, data: transformer(p.data, i) })) } : d))
}

// Publier un commentaire ou une réponse : { contenu, parent_id?, auteur }
// Affichage immédiat (avant la réponse du serveur), puis remplacé par le vrai commentaire.
export function useCommenter(publicationId) {
  const client = useQueryClient()
  const inserer = (c) => modifierCache(client, publicationId, (liste, i) => {
    if (!c.parent_id) return i === 0 ? [{ ...c, reponses: [], nb_reponses: 0 }, ...liste] : liste
    return liste.map((x) => (x.id === c.parent_id
      ? { ...x, reponses: [...(x.reponses ?? []), c], nb_reponses: (x.nb_reponses ?? 0) + 1 }
      : x))
  })
  const remplacer = (idTemporaire, vrai) => modifierCache(client, publicationId, (liste) => liste
    .filter((x) => vrai || x.id !== idTemporaire)
    .map((x) => {
      if (x.id === idTemporaire) return { ...vrai, nouveau: true, reponses: [], nb_reponses: 0 }
      const reponses = (x.reponses ?? [])
        .filter((r) => vrai || r.id !== idTemporaire)
        .map((r) => (r.id === idTemporaire ? { ...vrai, nouveau: true } : r))
      return { ...x, reponses, nb_reponses: reponses.length }
    }))

  return useMutation({
    mutationFn: ({ contenu, parent_id }) => api.post(`/publications/${publicationId}/commentaires`, { contenu, parent_id }).then((r) => r.data.data),
    onMutate: ({ contenu, parent_id, auteur }) => {
      const idTemporaire = `temp-${Date.now()}`
      inserer({ id: idTemporaire, parent_id: parent_id ?? null, contenu, auteur, peut_supprimer: false, nouveau: true, envoi: true })
      return { idTemporaire }
    },
    onSuccess: (vrai, _, { idTemporaire }) => remplacer(idTemporaire, vrai),
    onError: (_, __, ctx) => ctx && remplacer(ctx.idTemporaire, null), // échec : on retire le commentaire affiché
  })
}

// Supprimer un de ses commentaires
export function useSupprimerCommentaire(publicationId) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/commentaires/${id}`),
    onSuccess: (_, id) => {
      modifierCache(client, publicationId, (liste) => liste
        .filter((x) => x.id !== id)
        .map((x) => ({ ...x, reponses: (x.reponses ?? []).filter((r) => r.id !== id), nb_reponses: (x.reponses ?? []).filter((r) => r.id !== id).length })))
    },
  })
}