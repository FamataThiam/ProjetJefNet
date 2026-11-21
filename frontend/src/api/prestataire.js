import { useMutation, useQuery } from '@tanstack/react-query'
import api from './client'


export function useRayons() {
  return useQuery({
    queryKey: ['code-lists', 'RayonIntervention'],
    queryFn: () => api.get('/code-lists/RayonIntervention').then((r) => r.data.data),
    staleTime: 60 * 60 * 1000,
  })
}


export class ErreurEtape extends Error {
  constructor(etape, erreur, index = null) {
    super(erreur?.message)
    this.etape = etape
    this.erreur = erreur
    this.index = index
  }
}


export function useDevenirPrestataire() {
  return useMutation({
    mutationFn: async ({ profil, services, position, deja }) => {
      if (!deja.profil) {
        try {
          await api.post('/profil-pro', profil)
        } catch (e) {
          if (e.response?.status !== 409) throw new ErreurEtape(0, e) // 409 = déjà prestataire : on continue
        }
        deja.profil = true
      }

      for (let i = 0; i < services.length; i++) {
        if (deja.services.has(i)) continue
        try {
          await api.post('/profil-pro/services', services[i])
        } catch (e) {
          throw new ErreurEtape(1, e, i)
        }
        deja.services.add(i)
      }

      if (!deja.position) {
        try {
          await api.patch('/profil-pro/position', position)
        } catch (e) {
          throw new ErreurEtape(2, e)
        }
        deja.position = true
      }

  
      return api.get('/auth/moi').then((r) => r.data.user)
    },
  })
}