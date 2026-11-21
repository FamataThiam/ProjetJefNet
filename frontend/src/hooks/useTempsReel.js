import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { fermerEcho, ouvrirEcho } from '../lib/echo'
import useSession from './useSession'


export default function useTempsReel() {
  const { user } = useSession()
  const client = useQueryClient()
  const canal = user?.canal

  useEffect(() => {
    if (!canal) return
    const echo = ouvrirEcho()
    if (!echo) return

    echo.private(canal).listen('.notification.creee', ({ notification, non_lues }) => {
      client.setQueryData(['non-lues', 'notifications'], non_lues)
      client.invalidateQueries({ queryKey: ['notifications'] })
      window.dispatchEvent(new CustomEvent('jefnet:notification', { detail: notification }))
    })

    return () => echo.leave(canal)
  }, [canal, client])


  useEffect(() => { if (!user) fermerEcho() }, [user])
}