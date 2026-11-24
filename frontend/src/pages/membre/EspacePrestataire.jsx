import { useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useMonProfilPro } from '../../api/espacePro'
import { usePrestataire } from '../../api/visiteur'
import Disponibilites from '../../components/espace-pro/Disponibilites'
import ProfilPro from '../../components/espace-pro/ProfilPro'
import Realisations from '../../components/espace-pro/Realisations'
import Services from '../../components/espace-pro/Services'
import TableauDeBord from '../../components/espace-pro/TableauDeBord'
import '../../components/demandes/demandes.css'
import '../../components/reservations/reservations.css'
import '../../components/espace-pro/espace-pro.css'
import '../../components/espace/espace.css'
import Avatar from '../../components/membre/Avatar'
import useSession from '../../hooks/useSession'

const ONGLETS = [
  { cle: 'tableau', libelle: 'Tableau de bord' },
  { cle: 'services', libelle: 'Mes services' },
  { cle: 'disponibilites', libelle: 'Disponibilités' },
  { cle: 'realisations', libelle: 'Mes réalisations' },
  { cle: 'profil', libelle: 'Profil pro et certification' },
]
const RAYONS = { LOCALITE: 'intervient dans son quartier', VILLE: 'intervient dans toute la ville', REGION: 'intervient dans toute la région', PAYS: 'intervient dans tout le Sénégal' }
const BLEU = '#0174AB'
const moisCourant = () => new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

// Espace prestataire : /espace-prestataire (?onglet=services|disponibilites|realisations|profil, &publier=1 ouvre la fenêtre de publication)
export default function EspacePrestataire() {
  const { user } = useSession()
  const [params, setParams] = useSearchParams()
  const onglet = ONGLETS.some((o) => o.cle === params.get('onglet')) ? params.get('onglet') : 'tableau'
  const pro = useMonProfilPro()
  const publique = usePrestataire(user?.id)   // note, nombre d'avis, badge, services actifs

  // barre qui glisse sous l'onglet actif (même principe que l'espace client)
  const barre = useRef(null)
  const [glisse, setGlisse] = useState({ left: 0, width: 0 })
  useLayoutEffect(() => {
    const placer = () => {
      const actif = barre.current?.querySelector('.on')
      if (actif) setGlisse({ left: actif.offsetLeft, width: actif.offsetWidth })
    }
    placer()
    document.fonts?.ready.then(placer)   // les largeurs changent une fois la police chargée
    addEventListener('resize', placer)
    return () => removeEventListener('resize', placer)
  }, [onglet])

  if (user && !user.est_prestataire) return <Navigate to="/devenir-prestataire" replace />

  const choisir = (cle) => setParams(cle === 'tableau' ? {} : { onglet: cle }, { replace: true })
  const publier = onglet === 'realisations' && params.get('publier') === '1'
  const nom = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim()
  const m = user?.membre
  const p = pro.data
  const pub = publique.data
  const nbServices = pub?.services?.length ?? 0
  const certifie = p?.statut_certification === 'CERTIFIE' || pub?.est_certifie

  const pastilles = [
    certifie && 'Certifié',
    pub?.nombre_avis ? `${String(pub.note_moyenne).replace('.', ',')} ★ · ${pub.nombre_avis} avis` : 'Pas encore d’avis',
    `${nbServices} service${nbServices > 1 ? 's' : ''} actif${nbServices > 1 ? 's' : ''}`,
  ].filter(Boolean)

  return (
    <div className="espace" style={{ '--perso': m?.couleur_perso ?? BLEU }}>
      <div className="taches-espace" aria-hidden="true"><i /><i /><i /></div>

      <main className="espace-grille ep">
        <section className="bonjour">
          <span className="bulles" />
          <Avatar nom={nom} photo={m?.photo_url} couleur="rgba(255,255,255,.18)" taille="a72" />
          <div className="bonjour-texte">
            <small>Espace prestataire · {moisCourant()}</small>
            <h1>Bonjour {user?.prenom}</h1>
            <p>{[p?.titre_professionnel, [m?.localite, m?.ville].filter(Boolean).join(', '), RAYONS[p?.rayon_intervention]].filter(Boolean).join(' · ') || 'Chargement de ton espace…'}</p>
            {(p || pub) && <div className="ep-pastilles">{pastilles.map((t) => <span key={t}>{t}</span>)}</div>}
          </div>
          <div className="bonjour-actions">
            <Link to={`/prestataires/${user?.id}`} className="btn-blanc">Voir mon profil public</Link>
            <Link to="/espace-prestataire?onglet=realisations&publier=1" className="btn-verre">Publier une réalisation</Link>
          </div>
        </section>

        <nav className="onglets-espace verre" ref={barre}>
          <span className="glisse" style={glisse} />
          {ONGLETS.map((o) => (
            <button key={o.cle} type="button" className={onglet === o.cle ? 'on' : ''} onClick={() => choisir(o.cle)}>{o.libelle}</button>
          ))}
        </nav>

        <div className="ep-contenu">
          {onglet === 'tableau' && <TableauDeBord />}
          {onglet === 'services' && <Services />}
          {onglet === 'disponibilites' && <Disponibilites />}
          {onglet === 'realisations' && <Realisations key={publier ? 'publier' : 'liste'} ouvrirAuDepart={publier} onOuverte={() => publier && choisir('realisations')} />}
          {onglet === 'profil' && <ProfilPro />}
        </div>
      </main>
    </div>
  )
}