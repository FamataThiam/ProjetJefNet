import axios from 'axios'
import { lireJeton, effacerJeton } from '../lib/jeton'


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  
  headers: { Accept: 'application/json' }, 
  timeout: 20000,
})


api.interceptors.request.use((config) => {
  const jeton = lireJeton()
  if (jeton) config.headers.Authorization = `Bearer ${jeton}`
  return config
})


api.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    const jetonEnvoye = erreur.config?.headers?.Authorization
    if (erreur.response?.status === 401 && jetonEnvoye) {
      effacerJeton()
     
      window.dispatchEvent(new Event('jefnet:session-expiree'))
    }
    return Promise.reject(erreur)
  },
)

export default api