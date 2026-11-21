import { useMutation } from '@tanstack/react-query'
import api from './client'


export function useConnexion() {
  return useMutation({
    mutationFn: (identifiants) => api.post('/auth/connexion', identifiants).then((r) => r.data),
  })
}


export function useInscription() {
  return useMutation({
    mutationFn: (donnees) => api.post('/auth/inscription', donnees).then((r) => r.data),
  })
}


export function useVerifierEmail() {
  return useMutation({
    mutationFn: (donnees) => api.post('/auth/verifier-email', donnees).then((r) => r.data),
  })
}


export function useRenvoyerCode() {
  return useMutation({
    mutationFn: (email) => api.post('/auth/renvoyer-code', { email }).then((r) => r.data),
  })
}


export const lienSocial = (fournisseur) => `${api.defaults.baseURL}/auth/${fournisseur}/redirect`


export function messageErreur(erreur) {
  const r = erreur?.response
  if (!r) return 'Le serveur ne répond pas. Vérifie ta connexion internet.'
  if (r.status === 429) return 'Trop de tentatives. Réessaie dans une minute.'
  const champs = r.data?.errors
  if (champs) return Object.values(champs)[0]?.[0]
  return r.data?.message || 'Une erreur est survenue.'
}


export function erreursChamps(erreur) {
  const champs = erreur?.response?.data?.errors
  if (!champs) return {}
  return Object.fromEntries(Object.entries(champs).map(([k, v]) => [k, v[0]]))
}