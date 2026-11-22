import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useNonLus } from '../../api/fil'
import useSession from '../../hooks/useSession'
import BoutonMode from '../visiteur/BoutonMode'
import Avatar from './Avatar'
import Recherche from './Recherche'

const IC = {
  fil: <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  carte: <><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>,
  reservations: <><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
  demandes: <><path d="M4 10v4a1 1 0 0 0 1 1h3l6 4V5L8 9H5a1 1 0 0 0-1 1z" /><path d="M18 9a4 4 0 0 1 0 6" /></>,
  messages: <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z" />,
  notifications: <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4" />,
}

function Onglet({ to, icone, libelle, nombre }) {
  return (
    <NavLink to={to} className={({ isActive }) => `ic-nav ${isActive ? 'active' : ''}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{IC[icone]}</svg>
      {libelle}
      {nombre > 0 && <i className="pastille-mb">{nombre > 99 ? '99+' : nombre}</i>}
    </NavLink>
  )
}


export default function BarreMembre() {
  const { user, fermer } = useSession()
  const { notifications, messages } = useNonLus()
  const [ouvert, setOuvert] = useState(false)
  const [recherche, setRecherche] = useState(false)
  const zone = useRef(null)
  const navigate = useNavigate()
  const m = user?.membre

  useEffect(() => {
    if (!ouvert) return
    const dehors = (e) => { if (!zone.current?.contains(e.target)) setOuvert(false) }
    document.addEventListener('pointerdown', dehors)
    return () => document.removeEventListener('pointerdown', dehors)
  }, [ouvert])

  
  useEffect(() => {
    const raccourci = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setRecherche(true) } }
    addEventListener('keydown', raccourci)
    return () => removeEventListener('keydown', raccourci)
  }, [])

  const deconnecter = async () => { setOuvert(false); await fermer(); navigate('/', { replace: true }) }

  return (
    <header className="barre-mb">
      <div className="haut-mb">
        <Link to="/fil" className="logo-mb"><img src="/favicon-512.png" alt="" /><span>JefNet</span></Link>
        <button type="button" className="recherche-mb bouton-recherche" onClick={() => setRecherche(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <span>Rechercher un prestataire, un métier…</span>
          <kbd>Ctrl K</kbd>
        </button>
        <nav className="icones-mb">
          <Onglet to="/fil" icone="fil" libelle="Fil" />
          <Onglet to="/carte" icone="carte" libelle="Carte" />
          <Onglet to="/reservations" icone="reservations" libelle="Réservations" />
          <Onglet to="/demandes" icone="demandes" libelle="Demandes" />
          <Onglet to="/messages" icone="messages" libelle="Messages" nombre={messages} />
          <Onglet to="/notifications" icone="notifications" libelle="Notifications" nombre={notifications} />
          <div className="moi-mb" ref={zone}>
            <button type="button" className="moi-bouton" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert}>
              <Avatar nom={`${user?.prenom ?? ''} ${user?.nom ?? ''}`} photo={m?.photo_url} couleur={m?.couleur_perso} taille="a28" />
              <span>Moi ▾</span>
            </button>
            {ouvert && (
              <div className="menu-moi">
                {user?.est_prestataire ? (
              
                  <>
                    <Link to="/espace" onClick={() => setOuvert(false)}>Mon espace client</Link>
                    <Link to="/espace-prestataire" onClick={() => setOuvert(false)}>Mon espace prestataire</Link>
                    <Link to={`/prestataires/${user.id}`} onClick={() => setOuvert(false)}>Mon profil public</Link>
                  </>
                ) : (
                  <Link to="/espace" onClick={() => setOuvert(false)}>Mon espace</Link>
                )}
                <hr />
                <button type="button" className="rouge" onClick={deconnecter}>Se déconnecter</button>
              </div>
            )}
          </div>
          <BoutonMode />
        </nav>
      </div>
      {recherche && <Recherche onFermer={() => setRecherche(false)} />}
    </header>
  )
}