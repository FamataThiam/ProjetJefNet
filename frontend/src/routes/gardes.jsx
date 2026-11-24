import { useRef } from 'react'
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom'
import useSession from '../hooks/useSession'
import { accueilDe, apresConnexion, suiteSure } from '../lib/espace'

function Attente() {
  return <div className="grid min-h-screen place-items-center"><span className="h-10 w-10 animate-spin rounded-full border-4 border-[#0174ab]/25 border-t-[#0174ab]" /></div>
}


export function RouteInvite() {
  const { user, chargement } = useSession()
  const [params] = useSearchParams()
  if (chargement) return <Attente />
  return user ? <Navigate to={apresConnexion(user, suiteSure(params.get('suite')))} replace /> : <Outlet />
}


export function RouteProtegee() {
  const { user, chargement } = useSession()
  const lieu = useLocation()
  if (chargement) return <Attente />
  if (!user) return <Navigate to={`/connexion?suite=${encodeURIComponent(lieu.pathname + lieu.search)}`} replace />
  return <Outlet />
}


export function RouteProfilIncomplet() {
  const { user, chargement } = useSession()
  const completAArrivee = useRef(null)
  if (user && completAArrivee.current === null) completAArrivee.current = Boolean(user.profil_complete)
  if (chargement) return <Attente />
  if (!user) return <Navigate to="/connexion" replace />
  if (completAArrivee.current) return <Navigate to={accueilDe(user)} replace />
  return <Outlet />
}


export function RouteMembre() {
  const { user, chargement } = useSession()
  const lieu = useLocation()
  if (chargement) return <Attente />
  if (!user) return <Navigate to={`/connexion?suite=${encodeURIComponent(lieu.pathname + lieu.search)}`} replace />
  // un administrateur n'a pas de profil membre : il reste dans son espace
  if (user.est_administrateur) return <Navigate to="/admin" replace />
  if (!user.profil_complete) return <Navigate to="/completer-profil" replace />
  return <Outlet />
}