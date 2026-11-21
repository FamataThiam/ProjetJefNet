import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import api from '../api/client'
import { lireJeton } from './jeton'


let echo = null

// Chaque requête envoie l'identifiant de notre connexion Reverb :
// le backend (->toOthers()) ne nous renvoie alors pas nos propres messages.
api.interceptors.request.use((config) => {
  const id = echo?.socketId()
  if (id) config.headers['X-Socket-ID'] = id
  return config
})

export function ouvrirEcho() {
  if (echo) return echo
  const cle = import.meta.env.VITE_REVERB_APP_KEY
  if (!cle) return null // pas configuré : le site marche quand même (le badge se rafraîchit toutes les 30 s)

  window.Pusher = Pusher
  const https = (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https'
  echo = new Echo({
    broadcaster: 'reverb',
    key: cle,
    wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 6001),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
    forceTLS: https,
    enabledTransports: ['ws', 'wss'],
    // les canaux privés sont autorisés par le backend avec le jeton Sanctum
    authorizer: (canal) => ({
      authorize: (socketId, rappel) => {
        api.post('/broadcasting/auth', { socket_id: socketId, channel_name: canal.name }, {
          headers: { Authorization: `Bearer ${lireJeton()}` },
        })
          .then((r) => rappel(null, r.data))
          .catch((e) => rappel(e, null))
      },
    }),
  })
  return echo
}

// à la déconnexion
export function fermerEcho() {
  echo?.disconnect()
  echo = null
}