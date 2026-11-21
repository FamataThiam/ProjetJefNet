import { useContext } from 'react'
import { SessionContext } from '../contexts/session-context'


export default function useSession() {
  return useContext(SessionContext)
}