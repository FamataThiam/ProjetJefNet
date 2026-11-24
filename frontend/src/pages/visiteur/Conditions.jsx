import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import BoutonMode from '../../components/visiteur/BoutonMode'
import { FAQ, SECTIONS } from '../../components/conditions/contenu'
import useSession from '../../hooks/useSession'
import { accueilDe } from '../../lib/espace'
import '../../components/membre/membre.css'
import '../../components/visiteur/visiteur.css'
import '../../components/conditions/conditions.css'

// toutes les sections du sommaire, « Aide » comprise
const ENTREES = [...SECTIONS, { id: 'aide', titre: 'Aide' }]
const MISE_A_JOUR = '23 novembre 2026'

// Page ouverte à tous : conditions d'utilisation, confidentialité et aide
export default function Conditions() {
  const { user } = useSession()
  const { hash } = useLocation()
  const navigate = useNavigate()
  const [active, setActive] = useState(ENTREES[0].id)
  const sommaire = useRef(null)

  // sur téléphone, le sommaire défile à l'horizontale : on garde la section active visible
  useEffect(() => {
    const nav = sommaire.current
    const bouton = nav?.querySelector('button.on')
    if (nav && bouton && nav.scrollWidth > nav.clientWidth) {
      nav.scrollTo({ left: bouton.offsetLeft - 8, behavior: 'smooth' })
    }
  }, [active])

  // arrivée avec une ancre (/conditions#confidentialite) : on descend à la section
  useEffect(() => {
    const cible = hash && document.getElementById(hash.slice(1))
    if (cible) cible.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [hash])

  // le sommaire suit la section en cours de lecture
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entrees) => {
        const visible = entrees.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-15% 0px -70% 0px' },
    )
    ENTREES.forEach(({ id }) => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])

  const aller = (id) => {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
  const retour = () => (window.history.length > 1 ? navigate(-1) : navigate(accueilDe(user) === '/connexion' ? '/' : accueilDe(user)))

  return (
    <div className="mb">
      <div className="fond-mb" aria-hidden="true"><i className="t1" /><i className="t2" /></div>

      <header className="cg-haut">
        <div>
          <Link to={user ? accueilDe(user) : '/'} className="logo-mb"><img src="/favicon-512.png" alt="" /><span>JefNet</span></Link>
          <BoutonMode />
          <button type="button" className="cg-retour" onClick={retour}>Retour</button>
        </div>
      </header>

      <div className="cg-page">
        <div className="cg-ban">
          <small>Informations légales</small>
          <h1>Conditions d'utilisation</h1>
          <p>Les règles qui encadrent l'utilisation de JefNet par les clients et les prestataires, et la façon dont nous traitons tes données personnelles.</p>
          <span className="cg-maj">Dernière mise à jour : {MISE_A_JOUR}</span>
        </div>

        <div className="cg-grille">
          <nav ref={sommaire} className="cg-verre cg-sommaire" aria-label="Sommaire">
            <div className="eti">Sommaire</div>
            {ENTREES.map((s, i) => (
              <div key={s.id} style={{ display: 'contents' }}>
                {s.separe && <hr />}
                <button type="button" className={active === s.id ? 'on' : ''} onClick={() => aller(s.id)}>
                  <i>{String(i + 1).padStart(2, '0')}</i>{s.titre}
                </button>
              </div>
            ))}
          </nav>

          <main className="cg-verre cg-contenu">
            {SECTIONS.map((s, i) => (
              <section key={s.id} id={s.id} className="cg-section">
                <div className="cg-num">{String(i + 1).padStart(2, '0')}</div>
                <h2>{s.titre}</h2>
                {s.corps}
              </section>
            ))}
            <section id="aide" className="cg-section">
              <div className="cg-num">{String(ENTREES.length).padStart(2, '0')}</div>
              <h2>Aide</h2>
              <p>Les réponses aux questions les plus fréquentes.</p>
              <div className="cg-faq">
                {FAQ.map(([q, r]) => (
                  <details key={q}><summary>{q}</summary><p>{r}</p></details>
                ))}
              </div>
            </section>
          </main>
        </div>

        <p className="cg-pied">JefNet © {new Date().getFullYear()} · Projet de fin d'études, ISI Dakar</p>
      </div>
    </div>
  )
}