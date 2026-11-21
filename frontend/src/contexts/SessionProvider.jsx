import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import api from '../api/client'
import { effacerJeton, garderJeton, lireJeton } from '../lib/jeton'
import { SessionContext } from './session-context'


export default function SessionProvider({ children }) {
  const client = useQueryClient()
  const [jeton, setJeton] = useState(lireJeton)

  const moi = useQuery({
    queryKey: ['moi', jeton],
    queryFn: () => api.get('/auth/moi').then((r) => r.data.user),
    enabled: Boolean(jeton),
    retry: false,
    staleTime: Infinity,
  })


  const expire = moi.isError && moi.error?.response?.status === 401
  useEffect(() => {
    if (expire) { effacerJeton(); setJeton(null) }
  }, [expire])


  const ouvrir = (nouveauJeton, user, resterConnecte = true) => {
    garderJeton(nouveauJeton, resterConnecte)
    if (user) client.setQueryData(['moi', nouveauJeton], user)
    setJeton(nouveauJeton)
  }

 
  const actualiser = (user) => client.setQueryData(['moi', jeton], user)

 
  const fermer = async () => {
    try { await api.post('/auth/deconnexion') } catch { /* jeton déjà invalide */ }
    effacerJeton()
    setJeton(null)
    client.clear()
  }

  const user = jeton ? moi.data ?? null : null

  return (
    <SessionContext.Provider value={{ user, connecte: Boolean(user), chargement: Boolean(jeton) && moi.isPending, ouvrir, actualiser, fermer }}>
      {children}
    </SessionContext.Provider>
  )
}