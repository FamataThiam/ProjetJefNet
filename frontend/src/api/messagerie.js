import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from './client'


export const monMembreId = (user) => Number(user?.canal?.split('.')[1]) || null

const pageSuivante = (p) => (p.meta.current_page < p.meta.last_page ? p.meta.current_page + 1 : undefined)


export function useConversations(archivees = false) {
  return useInfiniteQuery({
    queryKey: ['conversations', archivees],
    queryFn: ({ pageParam }) => api.get('/conversations', { params: { page: pageParam, archivees: archivees ? 1 : undefined } }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: pageSuivante,
  })
}

// GET /conversations/{uuid}
export function useConversation(uuid) {
  return useQuery({
    queryKey: ['conversation', uuid],
    queryFn: () => api.get(`/conversations/${uuid}`).then((r) => r.data.data),
    enabled: Boolean(uuid),
  })
}


export function useMessages(uuid) {
  return useInfiniteQuery({
    queryKey: ['messages', uuid],
    queryFn: ({ pageParam }) => api.get(`/conversations/${uuid}/messages`, { params: { page: pageParam } }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: pageSuivante,
    enabled: Boolean(uuid),
  })
}


export function ajouterMessage(client, uuid, message) {
  client.setQueryData(['messages', uuid], (d) => {
    if (!d?.pages?.length) return d
    if (d.pages.some((p) => p.data.some((m) => m.id === message.id))) return d
    const [premiere, ...reste] = d.pages
    return { ...d, pages: [{ ...premiere, data: [message, ...premiere.data] }, ...reste] }
  })
}


export function changerMessages(client, uuid, fn) {
  client.setQueryData(['messages', uuid], (d) => (d?.pages ? { ...d, pages: d.pages.map((p) => ({ ...p, data: p.data.map(fn) })) } : d))
}


export function changerConversation(client, uuid, fn, enHaut = false) {
  client.setQueryData(['conversation', uuid], (c) => (c ? fn(c) : c))
  client.setQueriesData({ queryKey: ['conversations'] }, (d) => {
    if (!d?.pages) return d
    let trouvee = null
    const pages = d.pages.map((p) => ({
      ...p,
      data: p.data.flatMap((c) => {
        if (c.uuid !== uuid) return [c]
        trouvee = fn(c)
        return enHaut ? [] : [trouvee]
      }),
    }))
    if (enHaut && trouvee) pages[0] = { ...pages[0], data: [trouvee, ...pages[0].data] }
    return { ...d, pages }
  })
}


export function useDemarrerConversation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (uuidMembre) => api.post('/conversations', { destinataire_uuid: uuidMembre }).then((r) => r.data.data),
    onSuccess: (c) => client.setQueryData(['conversation', c.uuid], c),
  })
}


export function useEnvoyerMessage(uuid, moi) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ contenu, fichier, vocal, reponse }) => {
      const f = new FormData()
      if (contenu) f.append('contenu', contenu)
      if (fichier) f.append('fichier', fichier, fichier.name ?? (vocal ? 'vocal.webm' : 'fichier'))
      if (vocal) f.append('vocal', '1')
      if (reponse) f.append('reponse_a_id', reponse.id)
      return api.post(`/conversations/${uuid}/messages`, f).then((r) => r.data.data)
    },
    onMutate: ({ contenu, fichier, vocal, reponse, type }) => {
      const tempId = `temp-${Date.now()}`
      const maintenant = new Date()
      ajouterMessage(client, uuid, {
        id: tempId,
        temporaire: true,
        type: type ?? 'TEXTE',
        contenu: contenu ?? null,
        fichier: fichier ? { url: URL.createObjectURL(fichier), nom: fichier.name ?? (vocal ? 'Message vocal' : 'Fichier') } : null,
        expediteur: { membre_id: moi.id, nom: moi.nom, photo_url: moi.photo },
        est_moi: true,
        est_lu: false,
        reponse_a: reponse ? { id: reponse.id, apercu: reponse.apercu, expediteur: reponse.prenom } : null,
        envoye_le: maintenant.toISOString(),
        heure: maintenant.toTimeString().slice(0, 5),
      })
      return { tempId }
    },
    onSuccess: (message, _v, { tempId }) => {
      changerMessages(client, uuid, (m) => (m.id === tempId ? { ...message, est_moi: true } : m))
      changerConversation(client, uuid, (c) => ({
        ...c,
        dernier_message: { apercu: apercuDe(message), de_moi: true, envoye_le: message.envoye_le },
      }), true)
    },
    onError: (_e, _v, ctx) => changerMessages(client, uuid, (m) => (m.id === ctx?.tempId ? { ...m, temporaire: false, echec: true } : m)),
  })
}


export function useMarquerLus(uuid) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => api.patch(`/conversations/${uuid}/lire`).then((r) => r.data),
    onMutate: () => changerConversation(client, uuid, (c) => ({ ...c, non_lus: 0 })),
    onSuccess: (r) => client.setQueryData(['non-lus', 'messages'], r.non_lus_total),
  })
}


export function useArchiver(uuid) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (archiver) => api.patch(`/conversations/${uuid}/${archiver ? 'archiver' : 'desarchiver'}`).then((r) => r.data.data),
    onSuccess: (c) => {
      client.setQueryData(['conversation', uuid], c)
      client.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}



export const lancerAppel = (uuid) => api.post(`/conversations/${uuid}/appel`).then((r) => r.data.data)
export const rejoindreAppel = (uuid) => api.post(`/conversations/${uuid}/appel/rejoindre`).then((r) => r.data.data)
export const terminerAppel = (uuid, raison) => api.post(`/conversations/${uuid}/appel/terminer`, { raison }).catch(() => {})

// même texte court que le backend (MessageResource::apercu)
export function apercuDe(m) {
  return { IMAGE: 'Photo', AUDIO: 'Message vocal', VIDEO: 'Vidéo', FICHIER: 'Fichier' }[m?.type] ?? (m?.contenu ?? '').slice(0, 80)
}