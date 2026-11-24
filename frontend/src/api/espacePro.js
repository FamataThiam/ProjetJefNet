import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from './client'

const pageSuivante = (p) => (p.meta.current_page < p.meta.last_page ? p.meta.current_page + 1 : undefined)

// ================= profil professionnel =================

// GET /profil-pro : le profil professionnel du membre connecté
export function useMonProfilPro() {
  return useQuery({
    queryKey: ['profil-pro'],
    queryFn: () => api.get('/profil-pro').then((r) => r.data.data),
  })
}

// PATCH /profil-pro { titre_professionnel, experience, biographie, linkedin, portfolio, rayon_intervention }
export function useModifierProfilPro() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (donnees) => api.patch('/profil-pro', donnees).then((r) => r.data.data),
    onSuccess: (profil) => {
      client.setQueryData(['profil-pro'], profil)
      client.invalidateQueries({ queryKey: ['prestataire'] })
      client.invalidateQueries({ queryKey: ['demandes', 'a-prendre'] })   // le rayon change les demandes visibles
    },
  })
}

// PATCH /profil-pro/position { latitude, longitude }
export function useEnregistrerPosition() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (position) => api.patch('/profil-pro/position', position).then((r) => r.data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['profil-pro'] })
      client.invalidateQueries({ queryKey: ['carte'] })
    },
  })
}

// POST /profil-pro/certification (multipart : justificatif)
export function useDemanderCertification() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (fichier) => {
      const donnees = new FormData()
      donnees.append('justificatif', fichier)
      return api.post('/profil-pro/certification', donnees).then((r) => r.data.data)
    },
    onSuccess: (profil) => client.setQueryData(['profil-pro'], profil),
  })
}

// ================= tableau de bord =================

// GET /profil-pro/tableau-de-bord/{partie}
// partie : resume | evolution | repartitions | activite | entonnoir | a-faire
export function useTableauDeBord(partie, params) {
  return useQuery({
    queryKey: ['tableau-de-bord', partie, params ?? null],
    queryFn: () => api.get(`/profil-pro/tableau-de-bord/${partie}`, { params }).then((r) => r.data.data),
    staleTime: 60 * 1000,
  })
}

// ================= services =================

export const UNITES = [
  { valeur: 'forfait', libelle: 'Forfait' },
  { valeur: 'heure', libelle: 'Par heure' },
  { valeur: 'jour', libelle: 'Par jour' },
  { valeur: 'm2', libelle: 'Par m²' },
  { valeur: 'piece', libelle: 'Par pièce' },
]

// GET /profil-pro/services (actifs et désactivés)
export function useMesServicesPro() {
  return useQuery({
    queryKey: ['profil-pro', 'services'],
    queryFn: () => api.get('/profil-pro/services').then((r) => r.data.data),
  })
}

function useRafraichirServices() {
  const client = useQueryClient()
  return () => {
    client.invalidateQueries({ queryKey: ['profil-pro', 'services'] })
    client.invalidateQueries({ queryKey: ['prestataire'] })
    client.invalidateQueries({ queryKey: ['demandes', 'a-prendre'] })   // les domaines des services filtrent les demandes
  }
}

// POST /profil-pro/services ou PATCH /profil-pro/services/{id} (aussi pour réactiver : { est_actif: true })
export function useEnregistrerService() {
  const rafraichir = useRafraichirServices()
  return useMutation({
    mutationFn: ({ id, ...donnees }) => (id ? api.patch(`/profil-pro/services/${id}`, donnees) : api.post('/profil-pro/services', donnees)).then((r) => r.data),
    onSuccess: rafraichir,
  })
}

// DELETE /profil-pro/services/{id} : désactive le service (ses réservations sont gardées)
export function useDesactiverService() {
  const rafraichir = useRafraichirServices()
  return useMutation({
    mutationFn: (id) => api.delete(`/profil-pro/services/${id}`).then((r) => r.data),
    onSuccess: rafraichir,
  })
}

// ================= disponibilités =================

// GET /profil-pro/disponibilites : les plages à venir
export function useMesDisponibilites() {
  return useQuery({
    queryKey: ['profil-pro', 'disponibilites'],
    queryFn: () => api.get('/profil-pro/disponibilites').then((r) => r.data.data),
  })
}

function useRafraichirDispos() {
  const client = useQueryClient()
  return () => {
    client.invalidateQueries({ queryKey: ['profil-pro', 'disponibilites'] })
    client.invalidateQueries({ queryKey: ['prestataire'] })
  }
}

// POST /profil-pro/disponibilites { jour_disponibilite, heure_debut, heure_fin }
export function useAjouterDispo() {
  const rafraichir = useRafraichirDispos()
  return useMutation({
    mutationFn: (plage) => api.post('/profil-pro/disponibilites', plage).then((r) => r.data),
    onSuccess: rafraichir,
  })
}

// PATCH /profil-pro/disponibilites/{id}
export function useModifierDispo() {
  const rafraichir = useRafraichirDispos()
  return useMutation({
    mutationFn: ({ id, ...plage }) => api.patch(`/profil-pro/disponibilites/${id}`, plage).then((r) => r.data),
    onSuccess: rafraichir,
  })
}

// DELETE /profil-pro/disponibilites/{id}
export function useSupprimerDispo() {
  const rafraichir = useRafraichirDispos()
  return useMutation({
    mutationFn: (id) => api.delete(`/profil-pro/disponibilites/${id}`).then((r) => r.data),
    onSuccess: rafraichir,
  })
}

// copie de plusieurs plages (une requête par plage : le backend n'a pas de route groupée)
// renvoie { ajoutees, ignorees } : une plage qui chevauche une plage existante est ignorée
export function useCopierDispos() {
  const rafraichir = useRafraichirDispos()
  return useMutation({
    mutationFn: async (plages) => {
      let ajoutees = 0
      let ignorees = 0
      for (const p of plages) {
        try { await api.post('/profil-pro/disponibilites', p); ajoutees++ } catch { ignorees++ }
      }
      return { ajoutees, ignorees }
    },
    onSuccess: rafraichir,
  })
}

// ================= publications (réalisations) =================

// GET /profil-pro/publications : mes publications, y compris celles masquées par la modération
export function useMesPublications() {
  return useInfiniteQuery({
    queryKey: ['profil-pro', 'publications'],
    queryFn: ({ pageParam }) => api.get('/profil-pro/publications', { params: { page: pageParam } }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: pageSuivante,
  })
}

function useRafraichirPublications() {
  const client = useQueryClient()
  return () => {
    client.invalidateQueries({ queryKey: ['profil-pro', 'publications'] })
    client.invalidateQueries({ queryKey: ['fil'] })
    client.invalidateQueries({ queryKey: ['prestataire'] })
  }
}

// POST /profil-pro/publications ou POST /profil-pro/publications/{id}/modifier (multipart)
// { titre, description, fichiers: File[], aSupprimer: number[] }
export function useEnregistrerPublication(id) {
  const rafraichir = useRafraichirPublications()
  return useMutation({
    mutationFn: ({ titre, description, fichiers = [], aSupprimer = [] }) => {
      const d = new FormData()
      d.append('titre', titre)
      d.append('description', description ?? '')
      fichiers.forEach((f) => d.append('medias[]', f))
      aSupprimer.forEach((m) => d.append('medias_a_supprimer[]', m))
      return api.post(id ? `/profil-pro/publications/${id}/modifier` : '/profil-pro/publications', d).then((r) => r.data)
    },
    onSuccess: rafraichir,
  })
}

// DELETE /profil-pro/publications/{id}
export function useSupprimerPublication() {
  const rafraichir = useRafraichirPublications()
  return useMutation({
    mutationFn: (id) => api.delete(`/profil-pro/publications/${id}`).then((r) => r.data),
    onSuccess: rafraichir,
  })
}