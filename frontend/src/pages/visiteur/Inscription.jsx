import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { erreursChamps, lienSocial, messageErreur, useInscription, useRenvoyerCode, useVerifierEmail } from '../../api/auth'
import DecorConnexion from '../../components/connexion/DecorConnexion'
import useTenirDansEcran from '../../components/connexion/useTenirDansEcran'
import { SOCIAUX } from '../../components/connexion/IconesSociales'
import VitrineConnexion from '../../components/connexion/VitrineConnexion'
import BoutonMode from '../../components/visiteur/BoutonMode'
import useSession from '../../hooks/useSession'
import { apresConnexion, garderSuite, suiteSure } from '../../lib/espace'
import '../../components/connexion/connexion.css'
import '../../components/visiteur/visiteur.css'

const CLE_EMAIL = 'jefnet-inscription-email' 
const ATTENTE = 60 


function force(mdp) {
  if (!mdp) return [0, '']
  if (mdp.length < 8) return [1, 'Trop court']
  const lettre = /[a-zA-Z]/.test(mdp)
  const chiffre = /\d/.test(mdp)
  if (!lettre || !chiffre) return [2, lettre ? 'Ajoute un chiffre' : 'Ajoute une lettre']
  const bonus = mdp.length >= 12 || (/[A-Z]/.test(mdp) && /[a-z]/.test(mdp)) || /[^a-zA-Z0-9]/.test(mdp)
  return bonus ? [4, 'Excellent'] : [3, 'Bon mot de passe']
}
const COULEUR_FORCE = ['', '#dc2626', '#d97706', '#16a34a', '#0174ab']

function lireEmailEnCours() {
  try { return sessionStorage.getItem(CLE_EMAIL) || '' } catch { return '' }
}
function garderEmailEnCours(email) {
  try { email ? sessionStorage.setItem(CLE_EMAIL, email) : sessionStorage.removeItem(CLE_EMAIL) } catch { /* rien */ }
}

const Fleche = () => (
  <i className="fl"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></i>
)


function EtapeCompte({ suite, onInscrit }) {
  const [f, setF] = useState({ prenom: '', nom: '', email: '', password: '', password_confirmation: '' })
  const [voir, setVoir] = useState(false)
  const [cgu, setCgu] = useState(false)
  const [local, setLocal] = useState({})
  const inscription = useInscription()
  const serveur = erreursChamps(inscription.error)
  const erreurs = { ...serveur, ...local }
  const [niveau, libelle] = force(f.password)

  const changer = (cle) => (e) => {
    setF((v) => ({ ...v, [cle]: e.target.value }))
    setLocal((v) => ({ ...v, [cle]: undefined }))
    if (inscription.isError) inscription.reset() // on efface l'erreur du serveur dès qu'on corrige
  }

  const envoyer = (e) => {
    e.preventDefault()
    const err = {}
    if (!f.prenom.trim()) err.prenom = 'Le prénom est obligatoire.'
    if (!f.nom.trim()) err.nom = 'Le nom est obligatoire.'
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) err.email = "L'adresse e-mail n'est pas valide."
    if (niveau < 3) err.password = 'Au moins 8 caractères, avec une lettre et un chiffre.'
    else if (f.password !== f.password_confirmation) err.password = 'Les deux mots de passe ne correspondent pas.'
    if (!cgu) err.cgu = "Accepte les conditions d'utilisation pour continuer."
    setLocal(err)
    if (Object.keys(err).length) return
    inscription.mutate(f, { onSuccess: () => onInscrit(f.email.trim().toLowerCase()) })
  }

  const erreurGenerale = inscription.isError && !Object.keys(serveur).length ? messageErreur(inscription.error) : null

  return (
    <>
      <div className="etapes"><span className="on"><i>1</i>Ton compte</span><b /><span><i>2</i>Code e-mail</span></div>
      <h1 style={{ marginTop: 12 }}>Crée ton compte</h1>
      <p className="sous">Gratuit, en moins d'une minute.</p>

      <form onSubmit={envoyer} noValidate style={{ marginTop: 16 }}>
        <div className="duo">
          <div>
            <div className={`champ ${erreurs.prenom ? 'erreur' : ''}`}>
              <input placeholder="Prénom" autoComplete="given-name" value={f.prenom} onChange={changer('prenom')} />
              <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
            </div>
            {erreurs.prenom && <p className="msg-champ">{erreurs.prenom}</p>}
          </div>
          <div>
            <div className={`champ sans-icone ${erreurs.nom ? 'erreur' : ''}`}>
              <input placeholder="Nom" autoComplete="family-name" value={f.nom} onChange={changer('nom')} />
            </div>
            {erreurs.nom && <p className="msg-champ">{erreurs.nom}</p>}
          </div>
        </div>

        <div className={`champ ${erreurs.email ? 'erreur' : ''}`}>
          <input type="email" placeholder="Adresse e-mail" autoComplete="email" value={f.email} onChange={changer('email')} />
          <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>
        </div>
        {erreurs.email && <p className="msg-champ">{erreurs.email}</p>}

        <div className="duo">
          <div className={`champ ${erreurs.password ? 'erreur' : ''}`}>
            <input type={voir ? 'text' : 'password'} placeholder="Mot de passe" autoComplete="new-password" value={f.password} onChange={changer('password')} />
            <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          </div>
          <div className="champ">
            <input type={voir ? 'text' : 'password'} placeholder="Confirmation" autoComplete="new-password" value={f.password_confirmation} onChange={changer('password_confirmation')} />
            <button type="button" className="oeil" onClick={() => setVoir((v) => !v)} title={voir ? 'Cacher les mots de passe' : 'Afficher les mots de passe'}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
                {voir && <path d="M3 3l18 18" strokeLinecap="round" />}
              </svg>
            </button>
          </div>
        </div>
        {erreurs.password
          ? <p className="msg-champ">{erreurs.password}</p>
          : (
            <div className="force">
              {[1, 2, 3, 4].map((n) => <i key={n} className={n <= niveau ? `f${niveau}` : ''} />)}
              <span style={{ color: COULEUR_FORCE[niveau] }}>{libelle}</span>
            </div>
          )}

        <label className="cgu">
          <span className="coche"><input type="checkbox" checked={cgu} onChange={(e) => { setCgu(e.target.checked); setLocal((v) => ({ ...v, cgu: undefined })) }} /><i /></span>
          <span>J'accepte les <a href="/conditions" target="_blank" rel="noreferrer">conditions d'utilisation</a> de JefNet.</span>
        </label>
        {erreurs.cgu && <p className="msg-champ">{erreurs.cgu}</p>}
        {erreurGenerale && <p className="alerte on" role="alert">{erreurGenerale}</p>}

        <button type="submit" disabled={inscription.isPending} className={`envoyer ${inscription.isPending ? 'charge' : ''}`}>
          <span>Créer mon compte</span><Fleche /><i className="rond" />
        </button>
      </form>

      <div className="ou court">OU</div>
      <div className="mini-sociaux">
        {SOCIAUX.map(([cle, nom, icone]) => (
          <a key={cle} href={lienSocial(cle)} onClick={() => garderSuite(suite)} title={`Continuer avec ${nom}`}>{icone}</a>
        ))}
      </div>
      <p className="bas" style={{ marginTop: 14 }}>
        Déjà un compte ? <Link to={suite ? `/connexion?suite=${encodeURIComponent(suite)}` : '/connexion'}>Se connecter</Link>
      </p>
    </>
  )
}


function EtapeCode({ email, suite, onChangerEmail }) {
  const [chiffres, setChiffres] = useState(['', '', '', '', '', ''])
  const [reste, setReste] = useState(ATTENTE)
  const [secousse, setSecousse] = useState(0)
  const cases = useRef([])
  const verifier = useVerifierEmail()
  const renvoyer = useRenvoyerCode()
  const { ouvrir } = useSession()
  const navigate = useNavigate()

 
  useEffect(() => {
    if (reste <= 0) return
    const t = setTimeout(() => setReste((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [reste])

  useEffect(() => { cases.current[0]?.focus() }, [])

  const valider = (code) => {
    verifier.mutate({ email, code }, {

      onSuccess: ({ token, user }) => {
        garderEmailEnCours(null)
        ouvrir(token, user, true)
        navigate(apresConnexion(user, suite), { replace: true })
      },
      onError: () => {
        setSecousse((n) => n + 1)
        setChiffres(['', '', '', '', '', ''])
        cases.current[0]?.focus()
      },
    })
  }

  const remplir = (depart, texte) => {
    const nums = texte.replace(/\D/g, '').slice(0, 6 - depart).split('')
    if (!nums.length) return
    const suivant = [...chiffres]
    nums.forEach((n, k) => { suivant[depart + k] = n })
    setChiffres(suivant)
    const fin = Math.min(depart + nums.length, 5)
    cases.current[fin]?.focus()
    if (suivant.every(Boolean)) valider(suivant.join(''))
  }

  const touche = (i) => (e) => {
    if (e.key === 'Backspace' && !chiffres[i] && i > 0) {
      const suivant = [...chiffres]; suivant[i - 1] = ''
      setChiffres(suivant)
      cases.current[i - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && i > 0) cases.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < 5) cases.current[i + 1]?.focus()
  }

  const nouveauCode = () => {
    renvoyer.mutate(email, { onSuccess: () => setReste(ATTENTE) })
  }

  const code = chiffres.join('')
  const erreur = verifier.isError ? messageErreur(verifier.error) : renvoyer.isError ? messageErreur(renvoyer.error) : null

  return (
    <>
      <div className="etapes"><span className="fait"><i>✓</i>Ton compte</span><b className="plein" /><span className="on"><i>2</i>Code e-mail</span></div>
      <div className="enveloppe"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg></div>
      <h1 style={{ marginTop: 0 }}>Vérifie ton e-mail</h1>
      <p className="mail-envoye">On a envoyé un code à 6 chiffres à <b>{email}</b>.</p>

      <form onSubmit={(e) => { e.preventDefault(); if (code.length === 6) valider(code) }}>
        <div key={secousse} className={`code ${verifier.isError ? 'erreur' : ''}`}>
          {chiffres.map((c, i) => (
            <input key={i} ref={(el) => { cases.current[i] = el }} value={c} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'}
              aria-label={`Chiffre ${i + 1}`} maxLength={6}
              onChange={(e) => {
                if (!e.target.value) { const s = [...chiffres]; s[i] = ''; setChiffres(s); return }
                remplir(i, e.target.value)
              }}
              onPaste={(e) => { e.preventDefault(); remplir(0, e.clipboardData.getData('text')) }}
              onKeyDown={touche(i)} onFocus={(e) => e.target.select()} />
          ))}
        </div>

        {erreur && <p className="alerte on" role="alert">{erreur}</p>}
        {renvoyer.isSuccess && reste > ATTENTE - 5 && <p className="info">Nouveau code envoyé.</p>}

        <div className="renvoi">
          <span>Pas reçu ? Regarde dans les spams.</span>
          <button type="button" onClick={nouveauCode} disabled={reste > 0 || renvoyer.isPending}>
            {reste > 0 ? `Renvoyer (0:${String(reste).padStart(2, '0')})` : renvoyer.isPending ? 'Envoi…' : 'Renvoyer le code'}
          </button>
        </div>

        <button type="submit" disabled={code.length < 6 || verifier.isPending} className={`envoyer ${verifier.isPending ? 'charge' : ''}`}>
          <span>Vérifier et entrer</span><Fleche /><i className="rond" />
        </button>
      </form>
      <p className="bas"><button type="button" className="lien-bouton" onClick={onChangerEmail}>Changer d'adresse e-mail</button></p>
    </>
  )
}


export default function Inscription() {
  const [params] = useSearchParams()
  const suite = suiteSure(params.get('suite'))
  const navigate = useNavigate()
  const [email, setEmail] = useState(lireEmailEnCours)
  const carte = useRef(null)
  useTenirDansEcran(carte)

  const inscrit = (adresse) => { garderEmailEnCours(adresse); setEmail(adresse) }
  const changerEmail = () => { garderEmailEnCours(null); setEmail('') }

  return (
    <div className="cx inscription">
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
          <VitrineConnexion
            titre={<>Rejoins JefNet,<br /><em>c'est gratuit.</em></>}
            texte="Réserve des prestataires vérifiés, ou propose tes services à des milliers de clients." />

          <section className="formulaire" key={email ? 'code' : 'compte'}>
            {email
              ? <EtapeCode email={email} suite={suite} onChangerEmail={changerEmail} />
              : <EtapeCompte suite={suite} onInscrit={inscrit} />}
          </section>
        </div>
      </main>
      <p className="devise">TROUVER · RÉSERVER · NOTER</p>
    </div>
  )
}