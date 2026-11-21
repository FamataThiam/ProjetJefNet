import { useMutation, useQuery } from '@tanstack/react-query'
import useSession from '../hooks/useSession'
import api from './client'



const total = (r) => r.data.meta?.total ?? r.data.data?.length ?? 0

export function useResumeClient() {
  return useQuery({
    queryKey: ['espace', 'resume'],
    queryFn: async () => {
      const [dernieres, enAttente, confirmees, terminees, demandes] = await Promise.all([
        api.get('/reservations'),
        api.get('/reservations', { params: { statut: 'EN_ATTENTE' } }),
        api.get('/reservations', { params: { statut: 'CONFIRMEE' } }),
        api.get('/reservations', { params: { statut: 'TERMINEE' } }),
        api.get('/demandes', { params: { statut: 'EN_ATTENTE' } }),
      ])
      return {
        reservations: dernieres.data.data ?? [],
        total: total(dernieres),
        aVenir: total(enAttente) + total(confirmees),
        terminees: total(terminees),
        demandes: total(demandes),
      }
    },
    staleTime: 60 * 1000,
  })
}


function useMutationProfil(envoyer) {
  const { actualiser } = useSession()
  return useMutation({
    mutationFn: envoyer,
    onSuccess: (data) => { if (data?.user) actualiser(data.user) },
  })
}


export const useModifierProfil = () => useMutationProfil((champs) => api.patch('/profil', champs).then((r) => r.data))


export const useChangerPhoto = () => useMutationProfil((photo) => {
  const donnees = new FormData()
  donnees.append('photo', photo)
  return api.post('/profil/photo', donnees).then((r) => r.data)
})


export const useChangerSignature = () => useMutationProfil((signature) => {
  const donnees = new FormData()
  donnees.append('signature', signature, 'signature.png')
  return api.post('/profil/signature', donnees).then((r) => r.data)
})


export function useChangerMotDePasse() {
  return useMutation({
    mutationFn: (champs) => api.put('/profil/mot-de-passe', champs).then((r) => r.data),
  })
}


export function useDesactiverCompte() {
  return useMutation({
    mutationFn: (valeur) => api.delete('/profil', { data: { mot_de_passe: valeur, confirmation: valeur } }).then((r) => r.data),
  })
}