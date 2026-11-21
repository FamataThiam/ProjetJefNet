import axios from 'axios'
import { lireJeton } from '../lib/jeton'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Accept: 'application/json' },
})

// chaque requête part avec le jeton du membre connecté (s'il y en a un)
api.interceptors.request.use((config) => {
  const jeton = lireJeton()
  if (jeton) config.headers.Authorization = `Bearer ${jeton}`
  return config
})

export default api