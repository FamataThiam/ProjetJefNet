import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Avatar from '../../components/membre/Avatar'
import Apercu from '../../components/espace/Apercu'
import MonCompte from '../../components/espace/MonCompte'
import Securite from '../../components/espace/Securite'
import { useResumeClient } from '../../api/compte'
import useSession from '../../hooks/useSession'
import '../../components/espace/espace.css'

const ONGLETS = [
  { cle: 'apercu', libelle: 'Aperçu' },
  { cle: 'compte', libelle: 'Mon compte' },
  { cle: 'securite', libelle: 'Sécurité' },
]

const BLEU = '#0174AB'
const dateDuJour = () => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

// Tableau de bord du client : /espace (?onglet=compte ou ?onglet=securite)
export default function EspaceClient() {
  const { user } = useSession()
  const [params, setParams] = useSearchParams()
  const onglet = ONGLETS.some((o) => o.cle === params.get('onglet')) ? params.get('onglet') : 'apercu'
  const resume = useResumeClient()

  // couleur affichée : celle en cours d'essai, sinon celle enregistrée
  const [essai, setEssai] = useState(null)
  const perso = essai ?? user?.membre?.couleur_perso ?? BLEU

  // petite barre colorée qui glisse sous l'onglet actif
  const barre = useRef(null)
  const [glisse, setGlisse] = useState({ left: 0, width: 0 })
  useLayoutEffect(() => {
    const placer = () => {
      const actif = barre.current?.querySelector('.on')
      if (actif) setGlisse({ left: actif.offsetLeft, width: actif.offsetWidth })
    }
    placer()
    addEventListener('resize', placer)
    return () => removeEventListener('resize', placer)
  }, [onglet])

  const choisir = (cle) => setParams(cle === 'apercu' ? {} : { onglet: cle }, { replace: true })

  const nom = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim()
  const aVenir = resume.data?.aVenir ?? 0

  return (
    <div className="espace" style={{ '--perso': perso }}>
      <div className="taches-espace" aria-hidden="true"><i /><i /><i /></div>

      <main className="espace-grille">
        <section className="bonjour">
          <span className="bulles" />
          <Avatar nom={nom} photo={user?.membre?.photo_url} couleur="rgba(255,255,255,.18)" taille="a72" />
          <div className="bonjour-texte">
            <small>{dateDuJour()}</small>
            <h1>Bonjour {user?.prenom}</h1>
            <p>
              {resume.isPending ? 'Chargement de ton espace…'
                : aVenir > 0 ? <>Tu as <b>{aVenir} réservation{aVenir > 1 ? 's' : ''}</b> à venir.</>
                  : 'Aucune réservation à venir pour le moment.'}
            </p>
          </div>
          <div className="bonjour-actions">
            <Link to="/demandes/nouvelle" className="btn-blanc">Faire une demande</Link>
            <Link to="/recherche" className="btn-verre">Trouver un prestataire</Link>
          </div>
        </section>

        <nav className="onglets-espace verre" ref={barre}>
          <span className="glisse" style={glisse} />
          {ONGLETS.map((o) => (
            <button key={o.cle} type="button" className={onglet === o.cle ? 'on' : ''} onClick={() => choisir(o.cle)}>
              {o.libelle}
            </button>
          ))}
        </nav>

        {onglet === 'apercu' && <Apercu resume={resume} user={user} allerA={choisir} />}
        {onglet === 'compte' && <MonCompte user={user} perso={perso} onEssai={setEssai} />}
        {onglet === 'securite' && <Securite user={user} />}
      </main>
    </div>
  )
}