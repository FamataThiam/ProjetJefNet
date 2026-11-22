import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { ajouterMessage, apercuDe, changerConversation, monMembreId } from '../api/messagerie'
import { fermerEcho, ouvrirEcho } from '../lib/echo'
import useSession from './useSession'


export default function useTempsReel() {
  const { user } = useSession()
  const client = useQueryClient()
  const canal = user?.canal
  const moi = monMembreId(user)

  useEffect(() => {
    if (!canal) return
    const echo = ouvrirEcho()
    if (!echo) return
    const prevenir = (nom, detail) => window.dispatchEvent(new CustomEvent(nom, { detail }))

    echo.private(canal)
      .listen('.notification.creee', ({ notification, non_lues }) => {
        client.setQueryData(['non-lues', 'notifications'], non_lues)
        client.invalidateQueries({ queryKey: ['notifications'] })
        // une notification de réservation (confirmée, rapport, paiement…) : on recharge les réservations affichées
        if (notification?.lien?.startsWith('/reservations')) {
          client.invalidateQueries({ queryKey: ['reservations'] })
          client.invalidateQueries({ queryKey: ['reservation'] })
          client.invalidateQueries({ queryKey: ['espace', 'resume'] })
        }
        prevenir('jefnet:notification', notification)
      })
      .listen('.message.envoye', ({ conversation_uuid: uuid, message, non_lus_total }) => {
        const m = { ...message, est_moi: message.expediteur?.membre_id === moi }
        ajouterMessage(client, uuid, m)
        let connue = false
        changerConversation(client, uuid, (c) => {
          connue = true
          return {
            ...c,
            non_lus: m.est_moi ? c.non_lus : (c.non_lus ?? 0) + 1,
            dernier_message: { apercu: apercuDe(m), de_moi: m.est_moi, envoye_le: m.envoye_le },
          }
        }, true)
        if (!connue) client.invalidateQueries({ queryKey: ['conversations'] }) // nouvelle discussion
        if (typeof non_lus_total === 'number') client.setQueryData(['non-lus', 'messages'], non_lus_total)
        prevenir('jefnet:message', { uuid, message: m })
      })
      .listen('.appel.entrant', (appel) => prevenir('jefnet:appel-entrant', appel))
      .listen('.appel.termine', (fin) => prevenir('jefnet:appel-termine', fin))

    return () => echo.leave(canal)
  }, [canal, client, moi])

 
  useEffect(() => { if (!user) fermerEcho() }, [user])
}