import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { lienSocial, messageErreur, useConnexion } from '../../api/auth'
import { usePrestataire } from '../../api/visiteur'
import DecorConnexion from '../../components/connexion/DecorConnexion'
import useTenirDansEcran from '../../components/connexion/useTenirDansEcran'
import VitrineConnexion from '../../components/connexion/VitrineConnexion'
import BoutonMode from '../../components/visiteur/BoutonMode'
import useSession from '../../hooks/useSession'
import { apresConnexion, garderSuite, suiteSure } from '../../lib/espace'
import '../../components/connexion/connexion.css'
import '../../components/visiteur/visiteur.css'

const SOCIAUX = [
  ['google', 'Google', (
    <svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
  )],
  ['github', 'GitHub', (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.6 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z"/></svg>
  )],
  ['facebook', 'Facebook', (
    <svg viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"/></svg>
  )],
]

// erreurs renvoyées par Google / GitHub / Facebook (?erreur=…)
const ERREURS_SOCIALES = {
  CONNEXION_ANNULEE: 'La connexion a été annulée. Réessaie.',
  COMPTE_SUSPENDU: 'Ton compte est suspendu. Contacte le support JefNet.',
  COMPTE_DESACTIVE: 'Ton compte est désactivé.',
}

// Petite étiquette « Pour réserver Moussa Diop » quand on vient d'un profil
function PuceReservation({ uuid }) {
  const { data } = usePrestataire(uuid)
  if (!data) return null
  const u = data.prestataire
  return (
    <span className="puce">
      <i style={{ background: u.membre?.couleur_perso || '#0174ab' }}>
        {u.membre?.photo_url ? <img src={u.membre.photo_url} alt="" className="h-full w-full rounded-full object-cover" /> : `${u.prenom[0]}${u.nom[0]}`}
      </i>
      Pour réserver <b>{u.prenom} {u.nom}</b>
    </span>
  )
}

export default function Connexion() {
  const [params] = useSearchParams()
  const suite = suiteSure(params.get('suite'))
  const uuidPrestataire = suite?.match(/^\/prestataires\/([0-9a-f-]{36})/i)?.[1]

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [voir, setVoir] = useState(false)
  const [resterConnecte, setResterConnecte] = useState(true)
  const [secousse, setSecousse] = useState(0)
  const connexion = useConnexion()
  const { ouvrir } = useSession()
  const navigate = useNavigate()
  const erreurSociale = params.get('erreur')

  const carte = useRef(null)
  useTenirDansEcran(carte)
  const bouton = useRef(null)

  // la carte s'incline un peu avec la souris + tache de lumière (ordinateur seulement)
  useEffect(() => {
    const el = carte.current
    if (!el || !matchMedia('(hover: hover)').matches) return
    const bouger = (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      el.style.transform = `rotateY(${(x - 0.5) * 5}deg) rotateX(${(0.5 - y) * 5}deg)`
      el.style.setProperty('--x', `${x * 100}%`)
      el.style.setProperty('--y', `${y * 100}%`)
    }
    const sortir = () => { el.style.transform = '' }
    el.addEventListener('mousemove', bouger)
    el.addEventListener('mouseleave', sortir)
    return () => { el.removeEventListener('mousemove', bouger); el.removeEventListener('mouseleave', sortir) }
  }, [])

  // onde qui part de l'endroit du clic sur le bouton
  const onde = (e) => {
    const b = bouton.current
    const r = b.getBoundingClientRect()
    const t = r.width / 2
    const o = document.createElement('i')
    o.className = 'onde'
    o.style.cssText = `width:${t}px;height:${t}px;left:${e.clientX - r.left - t / 2}px;top:${e.clientY - r.top - t / 2}px`
    b.appendChild(o)
    setTimeout(() => o.remove(), 650)
  }

  const envoyer = (e) => {
    e.preventDefault()
    connexion.mutate(
      { email, password: motDePasse },
      {
        onError: () => setSecousse((n) => n + 1),
        // connecté : on garde le jeton puis on va à la suite (profil du prestataire) ou dans son espace
        onSuccess: ({ token, user }) => {
          ouvrir(token, user, resterConnecte)
          navigate(apresConnexion(user, suite), { replace: true })
        },
      },
    )
  }

  const erreur = connexion.isError
    ? messageErreur(connexion.error)
    : erreurSociale && !connexion.isSuccess ? (ERREURS_SOCIALES[erreurSociale] ?? 'La connexion a échoué. Réessaie.') : null

  return (
    <div className="cx">
      <DecorConnexion />

      <button type="button" className="coin retour" title="Revenir à la page précédente"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M15 5l-7 7 7 7" /></svg>
        <span>Retour</span>
      </button>
      <div className="support-mode"><BoutonMode /></div>

      <main>
        <div ref={carte} className="carte">
          <span className="lumiere" />

          <VitrineConnexion />

          <section className="formulaire">
            {uuidPrestataire && <PuceReservation uuid={uuidPrestataire} />}
            <h1>Bon retour !</h1>
            <p className="sous">Connecte-toi pour continuer.</p>

            <div className="sociaux2">
              {SOCIAUX.map(([cle, nom, icone]) => (
                <a key={cle} href={lienSocial(cle)} onClick={() => garderSuite(suite)} title={`Continuer avec ${nom}`} className="social">{icone}<span>{nom}</span></a>
              ))}
            </div>

            <div className="ou">OU AVEC TON E-MAIL</div>

            <form onSubmit={envoyer} noValidate>
              <div key={`mail-${secousse}`} className={`champ ${erreur ? 'erreur' : ''}`}>
                <input type="email" placeholder="Adresse e-mail" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)} />
                <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>
              </div>
              <div className="champ">
                <input type={voir ? 'text' : 'password'} placeholder="Mot de passe" autoComplete="current-password" required
                  value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
                <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                <button type="button" className="oeil" onClick={() => setVoir((v) => !v)} title={voir ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
                    {voir && <path d="M3 3l18 18" strokeLinecap="round" />}
                  </svg>
                </button>
              </div>

              {erreur && <p className="alerte on" role="alert">{erreur}</p>}

              <div className="options">
                <label className="coche">
                  <input type="checkbox" checked={resterConnecte} onChange={(e) => setResterConnecte(e.target.checked)} /><i />Rester connecté
                </label>
                <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
              </div>

              <button ref={bouton} type="submit" onPointerDown={onde} disabled={connexion.isPending}
                className={`envoyer ${connexion.isPending ? 'charge' : ''} ${connexion.isSuccess ? 'ok' : ''}`}>
                <span>{connexion.isSuccess ? 'Connecté ✓' : 'Se connecter'}</span>
                <i className="fl"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></i>
                <i className="rond" />
              </button>
            </form>

            <p className="bas">Pas encore de compte ? <Link to={suite ? `/inscription?suite=${encodeURIComponent(suite)}` : '/inscription'}>S'inscrire gratuitement</Link></p>
          </section>
        </div>
      </main>
      <p className="devise">TROUVER · RÉSERVER · NOTER</p>
    </div>
  )
}