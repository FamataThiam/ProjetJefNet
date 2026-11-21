import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import api from '../api/client'
import { lireJeton } from './jeton'


let echo = null

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


export function fermerEcho() {
  echo?.disconnect()
  echo = null
}