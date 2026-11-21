import { useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { erreursChamps, messageErreur } from '../../api/auth'
import { useDevenirPrestataire, useRayons } from '../../api/prestataire'
import { useDomaines } from '../../api/visiteur'
import useSession from '../../hooks/useSession'
import Bienvenue from '../../components/devenir/Bienvenue'
import EtapeMetier from '../../components/devenir/EtapeMetier'
import EtapeServices from '../../components/devenir/EtapeServices'
import EtapeVerification from '../../components/devenir/EtapeVerification'
import EtapeZone from '../../components/devenir/EtapeZone'
import FicheApercu from '../../components/devenir/FicheApercu'
import { ETAPES, serviceVide, verifierMetier, verifierServices, verifierZone, vide } from '../../components/devenir/donnees'
import '../../components/devenir/devenir.css'


export default function DevenirPrestataire() {
  const { user, actualiser } = useSession()
  const domaines = useDomaines().data ?? []
  const rayons = useRayons().data

 
  const dejaPrestataire = useRef(Boolean(user?.est_prestataire)).current

  const [etape, setEtape] = useState(0)
  const [metier, setMetier] = useState({ titre_professionnel: '', experience: '', biographie: '', linkedin: '', portfolio: '' })
  const [services, setServices] = useState([serviceVide()])
  const [zone, setZone] = useState({ rayon: 'VILLE', position: null, source: '' })
  const [accord, setAccord] = useState(false)
  const [erreurs, setErreurs] = useState({ metier: {}, services: [], zone: {}, envoi: '' })
  const [termine, setTermine] = useState(false)

  const envoyer = useDevenirPrestataire()
  const deja = useRef({ profil: false, services: new Set(), position: false })

  if (dejaPrestataire) return <Navigate to="/espace-prestataire" replace />

  const changerMetier = (champs) => {
    setMetier((m) => ({ ...m, ...champs }))
    setErreurs((e) => ({ ...e, metier: { ...e.metier, ...Object.fromEntries(Object.keys(champs).map((k) => [k, undefined])) } }))
  }
  const changerZone = (champs) => {
    setZone((z) => ({ ...z, ...champs }))
    setErreurs((e) => ({ ...e, zone: {} }))
  }
  const changerServices = (maj) => {
    setServices(maj)
    setErreurs((e) => ({ ...e, services: [] }))
  }

  
  const verifier = (n) => {
    if (n === 0) { const e = verifierMetier(metier); setErreurs((x) => ({ ...x, metier: e })); return vide(e) }
    if (n === 1) { const e = verifierServices(services); setErreurs((x) => ({ ...x, services: e })); return e.every(vide) }
    if (n === 2) { const e = verifierZone(zone); setErreurs((x) => ({ ...x, zone: e })); return vide(e) }
    return true
  }


  const montrerErreur = () => setTimeout(() => document.querySelector('.form-dp .erreur, .form-dp .msg-erreur')
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80)

  const aller = (n) => {
    if (n < 0 || n > 3) return
   
    for (let i = etape; i < n; i++) if (!verifier(i)) { setEtape(i); return montrerErreur() }
    setEtape(n)
    scrollTo({ top: 0, behavior: 'smooth' })
  }

  const valider = () => {
    if (!accord) {
      setErreurs((e) => ({ ...e, envoi: 'Coche la case pour confirmer ton engagement.' }))
      return montrerErreur()
    }
    setErreurs((e) => ({ ...e, envoi: '' }))

    const nettoyer = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? v.trim() || null : v]))
    envoyer.mutate({
      profil: { ...nettoyer(metier), rayon_intervention: zone.rayon },
      services: services.map((s) => ({ ...nettoyer(s), prix: Number(s.prix) })),
      position: zone.position,
      deja: deja.current,
    }, {
      onSuccess: (membre) => { setTermine(true); actualiser(membre); scrollTo({ top: 0 }) },
      onError: (err) => {
        // on renvoie la personne à l'étape qui pose problème, avec les messages du backend
        const e = err.erreur ?? err
        const champs = erreursChamps(e)
        if (err.etape === 0) setErreurs((x) => ({ ...x, metier: champs, envoi: '' }))
        if (err.etape === 1) setErreurs((x) => ({ ...x, services: services.map((_, i) => (i === err.index ? champs : {})) }))
        if (err.etape === 2) setErreurs((x) => ({ ...x, zone: { position: messageErreur(e) } }))
        if (err.etape !== undefined && (err.etape !== 0 || Object.keys(champs).length)) setEtape(err.etape)
        else setErreurs((x) => ({ ...x, envoi: messageErreur(e) }))
        montrerErreur()
      },
    })
  }

  if (termine) return <main className="page-dp"><Bienvenue user={user} /></main>

  return (
    <main className="page-dp">
      <div className="tete-dp">
        <div>
          <small>Espace client · Devenir prestataire</small>
          <h1>Propose ton savoir-faire</h1>
          <p>Quatre petites étapes. Ton compte reste le même : tu gardes tes réservations et tu gagnes un espace prestataire.</p>
        </div>
        <nav className="etapes-dp verre-dp">
          {ETAPES.map((libelle, i) => (
            <button key={libelle} type="button" className={i === etape ? 'on' : i < etape ? 'fait' : ''} onClick={() => aller(i)}>
              <b>{i + 1}</b><span>{libelle}</span>
            </button>
          ))}
        </nav>
      </div>

      <section className="verre-dp form-dp">
        <div key={etape} className="anim-dp">
          {etape === 0 && <EtapeMetier metier={metier} changer={changerMetier} erreurs={erreurs.metier} />}
          {etape === 1 && <EtapeServices services={services} setServices={changerServices} domaines={domaines} erreurs={erreurs.services} />}
          {etape === 2 && <EtapeZone zone={zone} changer={changerZone} rayons={rayons} membre={user?.membre} erreurs={erreurs.zone} />}
          {etape === 3 && <EtapeVerification metier={metier} services={services} zone={zone} domaines={domaines}
            accord={accord} setAccord={(v) => { setAccord(v); setErreurs((e) => ({ ...e, envoi: '' })) }} erreur={erreurs.envoi} />}
        </div>

        <div className="pied-dp">
          <button type="button" className="btn-dp sec" onClick={() => aller(etape - 1)} style={{ visibility: etape ? 'visible' : 'hidden' }}>Précédent</button>
          <span className="info-dp">Étape {etape + 1} sur 4</span>
          {etape < 3
            ? <button type="button" className="btn-dp prim" onClick={() => aller(etape + 1)}>Continuer</button>
            : <button type="button" className="btn-dp prim" onClick={valider} disabled={envoyer.isPending}>
              {envoyer.isPending ? 'Création de ta fiche…' : 'Devenir prestataire'}
            </button>}
        </div>
      </section>

      <aside className="cote-dp">
        <small>Ta future fiche</small>
        <FicheApercu user={user} metier={metier} services={services} zone={zone} domaines={domaines} />
        <div className="verre-dp conseil-dp">
          <b>Le badge certifié</b>
          Après l'inscription, tu pourras envoyer une pièce justificative depuis ton espace prestataire. Il n'est pas obligatoire pour recevoir des demandes.
        </div>
      </aside>
    </main>
  )
}