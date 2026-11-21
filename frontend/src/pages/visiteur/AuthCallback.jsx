import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import useSession from '../../hooks/useSession'
import { garderJeton } from '../../lib/jeton'
import { apresConnexion, reprendreSuite } from '../../lib/espace'


export default function AuthCallback() {
  const navigate = useNavigate()
  const { ouvrir } = useSession()
  const fait = useRef(false)

  useEffect(() => {
    if (fait.current) return
    fait.current = true

    const params = new URLSearchParams(window.location.hash.slice(1))
    window.history.replaceState(null, '', window.location.pathname) // on retire le jeton de l'adresse
    const jeton = params.get('token')
    const suite = reprendreSuite()

    if (!jeton) {
      navigate(`/connexion?erreur=${params.get('erreur') || 'CONNEXION_ANNULEE'}`, { replace: true })
      return
    }

    garderJeton(jeton, true)
    api.get('/auth/moi')
      .then((r) => {
        ouvrir(jeton, r.data.user, true)
        navigate(apresConnexion(r.data.user, suite), { replace: true })
      })
      .catch(() => navigate('/connexion?erreur=CONNEXION_ANNULEE', { replace: true }))
  }, [navigate, ouvrir])

  return (
    <div className="grid min-h-screen place-items-center bg-[#e7eef8] dark:bg-[#0f1b2d]">
      <div className="text-center">
        <span className="mx-auto block h-12 w-12 animate-spin rounded-full border-4 border-[#0174ab]/25 border-t-[#0174ab]" />
        <p className="mt-4 font-semibold text-slate-600 dark:text-slate-300">Connexion en cours…</p>
      </div>
    </div>
  )
}