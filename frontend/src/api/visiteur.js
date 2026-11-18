import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import api from './client'

// Tous les domaines (métiers) avec leur nombre de prestataires
export function useDomaines() {
  return useQuery({
    queryKey: ['domaines'],
    queryFn: () => api.get('/domaines').then((r) => r.data.domaines),
    staleTime: 10 * 60 * 1000, // les domaines changent rarement
  })
}

// Première page des prestataires (pour l'animation de l'accueil)
export function usePrestatairesApercu() {
  return useQuery({
    queryKey: ['prestataires', 'apercu'],
    queryFn: () => api.get('/prestataires').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
}

// Prestataires autour d'un point (carte) : { centre, rayon_km, total, prestataires: [...] }
export function useCarte({ lat, lng, rayon, domaine }) {
  return useQuery({
    queryKey: ['carte', lat, lng, rayon, domaine],
    queryFn: () => api.get('/prestataires/carte', { params: { lat, lng, rayon, domaine: domaine || undefined } })
      .then((r) => r.data.data),
    placeholderData: (precedent) => precedent, // garde les points affichés pendant le chargement
  })
}

// Profil complet d'un prestataire (biographie, quartier, services…)
export function usePrestataire(id) {
  return useQuery({
    queryKey: ['prestataire', id],
    queryFn: () => api.get(`/prestataires/${id}`).then((r) => r.data.data),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  })
}

// Photos des dernières publications d'un prestataire (3 au maximum)
export function usePhotosRealisations(id) {
  return useQuery({
    queryKey: ['prestataire', id, 'photos'],
    queryFn: () => api.get(`/prestataires/${id}/publications`).then((r) =>
      r.data.data.flatMap((pub) => pub.medias.filter((m) => m.type === 'IMAGE').map((m) => m.url)).slice(0, 3)),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  })
}

// Page d'accueil : réalisations avant / après, derniers avis, chiffres
export function useAccueil() {
  return useQuery({
    queryKey: ['accueil'],
    queryFn: () => api.get('/accueil').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
}

// Publications d'un prestataire, page par page (10 par page)
export function usePublicationsPrestataire(id) {
  return useInfiniteQuery({
    queryKey: ['prestataire', id, 'publications'],
    queryFn: ({ pageParam }) => api.get(`/prestataires/${id}/publications`, { params: { page: pageParam } }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (d) => (d.meta.current_page < d.meta.last_page ? d.meta.current_page + 1 : undefined),
    enabled: Boolean(id),
  })
}

// Avis d'un prestataire, page par page, avec les statistiques (moyenne, répartition)
export function useAvisPrestataire(id) {
  return useInfiniteQuery({
    queryKey: ['prestataire', id, 'avis'],
    queryFn: ({ pageParam }) => api.get(`/prestataires/${id}/avis`, { params: { page: pageParam } }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (d) => (d.meta.current_page < d.meta.last_page ? d.meta.current_page + 1 : undefined),
    enabled: Boolean(id),
  })
}