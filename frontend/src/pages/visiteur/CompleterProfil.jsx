import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { erreursChamps, messageErreur } from '../../api/auth'
import { useCompleterProfil } from '../../api/profil'
import CarteMembre from '../../components/completer-profil/CarteMembre'
import DecorConnexion from '../../components/connexion/DecorConnexion'
import useTenirDansEcran from '../../components/connexion/useTenirDansEcran'
import BoutonMode from '../../components/visiteur/BoutonMode'
import useSession from '../../hooks/useSession'
import { suiteSure } from '../../lib/espace'
import '../../components/connexion/connexion.css'
import '../../components/visiteur/visiteur.css'

const VILLES = ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Mbour', 'Touba', 'Diourbel', 'Kaolack', 'Saint-Louis',
  'Louga', 'Ziguinchor', 'Tambacounda', 'Kolda', 'Fatick', 'Kaffrine', 'Kédougou', 'Matam', 'Sédhiou']
const ASTUCES = ['', 'Chaque information que tu remplis apparaît ici.', "Ton numéro et ton quartier s'ajoutent à ta carte.", 'Dernière étape : ton rôle sur JefNet.', 'Ta carte est prête !']
// à quelle étape se trouve chaque champ (pour y revenir si le serveur refuse)
const ETAPE_DU_CHAMP = { prenom: 1, nom: 1, username: 1, photo: 1, telephone: 2, ville: 2, localite: 2 }
const TEL_VALIDE = /^7[05678]\d{7}$/
const PHOTO_MAX = 2 * 1024 * 1024

const nettoyerPseudo = (v) => v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9_-]/g, '').slice(0, 30)
const formaterTel = (v) => {
  const n = v.replace(/\D/g, '').replace(/^221/, '').slice(0, 9)
  return [n.slice(0, 2), n.slice(2, 5), n.slice(5, 7), n.slice(7, 9)].filter(Boolean).join(' ')
}

const Fleche = ({ d = 'M5 12h14M13 6l6 6-6 6' }) => (
  <i className="fl"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d={d} /></svg></i>
)

function confettis() {
  const couleurs = ['#0174ab', '#38b4ea', '#7dd3fc', '#0e9f6e', '#fbbf24']
  for (let k = 0; k < 60; k++) {
    const c = document.createElement('i')
    c.className = 'cx-confetti'
    c.style.left = `${40 + Math.random() * 40}vw`
    c.style.top = '-20px'
    c.style.background = couleurs[k % 5]
    c.style.setProperty('--dx', `${Math.random() * 300 - 150}px`)
    c.style.setProperty('--r', `${Math.random() * 720}deg`)
    c.style.animationDelay = `${Math.random() * 0.4}s`
    document.body.appendChild(c)
    setTimeout(() => c.remove(), 2200)
  }
}

export default function CompleterProfil() {
  const { user, actualiser } = useSession()
  const [params] = useSearchParams()
  const suite = suiteSure(params.get('suite'))
  const navigate = useNavigate()
  const completer = useCompleterProfil()

  const [f, setF] = useState({ prenom: user?.prenom ?? '', nom: user?.nom ?? '', username: '', telephone: '', ville: '', localite: '' })
  const [photo, setPhoto] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [role, setRole] = useState(null)
  const [etape, setEtape] = useState(1)
  const [nuages, setNuages] = useState('')
  const [erreurs, setErreurs] = useState({})
  const carte = useRef(null)
  useTenirDansEcran(carte)

  // on libère l'aperçu de la photo quand on la change
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }, [photoUrl])

  const tel = f.telephone.replace(/\D/g, '')
  const telValide = TEL_VALIDE.test(tel)
  const faits = [photo, f.prenom.trim() && f.nom.trim(), f.username.length >= 3, telValide, f.ville.trim(), f.localite.trim(), role].filter(Boolean).length
  const pourcentage = Math.round((faits / 7) * 100)

  const changer = (cle, transformer = (v) => v) => (e) => {
    setF((v) => ({ ...v, [cle]: transformer(e.target.value) }))
    setErreurs((v) => ({ ...v, [cle]: undefined }))
  }

  const choisirPhoto = (e) => {
    const fichier = e.target.files?.[0]
    if (!fichier) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(fichier.type)) return setErreurs((v) => ({ ...v, photo: 'Formats acceptés : JPG, PNG, WEBP.' }))
    if (fichier.size > PHOTO_MAX) return setErreurs((v) => ({ ...v, photo: "L'image ne doit pas dépasser 2 Mo." }))
    setPhoto(fichier)
    setPhotoUrl(URL.createObjectURL(fichier))
    setErreurs((v) => ({ ...v, photo: undefined }))
  }

  // changement d'étape : les nuages passent devant, puis la nouvelle étape apparaît
  const aller = (n) => {
    if (n === etape) return
    setNuages(n > etape ? 'passe' : 'passe recule')
    setTimeout(() => setEtape(n), 450)
    setTimeout(() => setNuages(''), 1200)
  }

  const verifier = (n) => {
    const err = {}
    if (n === 1) {
      if (!f.prenom.trim()) err.prenom = 'Le prénom est obligatoire.'
      if (!f.nom.trim()) err.nom = 'Le nom est obligatoire.'
      if (f.username.length < 3) err.username = "Au moins 3 caractères (lettres, chiffres, - ou _)."
    }
    if (n === 2) {
      if (!telValide) err.telephone = 'Numéro invalide. Exemple : 77 123 45 67.'
      if (!f.ville.trim()) err.ville = 'La ville est obligatoire.'
      if (!f.localite.trim()) err.localite = 'Le quartier est obligatoire.'
    }
    if (n === 3 && !role) err.role = 'Choisis ce que tu viens faire sur JefNet.'
    setErreurs((v) => ({ ...v, ...err }))
    return !Object.keys(err).length
  }

  const continuer = (n) => { if (verifier(n)) aller(n + 1) }

  const finir = () => {
    if (!verifier(3)) return
    completer.mutate({ ...f, telephone: tel, photo }, {
      onSuccess: ({ user: misAJour }) => {
        aller(4)
        setTimeout(confettis, 500)
        // après la fête : la suite (profil d'un prestataire), sinon l'espace choisi
        setTimeout(() => {
          actualiser(misAJour)
          navigate(suite || (role === 'prestataire' ? '/devenir-prestataire' : '/fil'), { replace: true })
        }, 2600)
      },
      onError: (e) => {
        const champs = erreursChamps(e)
        if (Object.keys(champs).length) {
          setErreurs(champs)
          const premiere = Math.min(...Object.keys(champs).map((c) => ETAPE_DU_CHAMP[c] ?? 3))
          aller(premiere)
        } else if (e?.response?.status === 409) {
          navigate('/', { replace: true }) // profil déjà complété
        }
      },
    })
  }

  const suggestions = !f.username && f.prenom.trim() && f.nom.trim()
    ? [...new Set([
      nettoyerPseudo(`${f.prenom}_${f.nom}`.replace(/\s+/g, '_')),
      `${nettoyerPseudo(f.prenom)}_${nettoyerPseudo(f.nom)[0] ?? ''}${new Date().getFullYear() % 100}`,
      nettoyerPseudo(f.prenom + f.nom),
    ])].filter((s) => s.length >= 3)
    : []

  const Erreur = ({ champ }) => (erreurs[champ] ? <p className="msg-champ">{erreurs[champ]}</p> : null)
  const pas = (n) => (n < etape ? 'fait' : n === etape ? 'on' : '')
  const erreurGenerale = completer.isError && !Object.keys(erreursChamps(completer.error)).length ? messageErreur(completer.error) : null

  return (
    <div className="cx inscription">
      <DecorConnexion />
      <div className="support-mode"><BoutonMode /></div>

      <main>
        <div ref={carte} className="carte">
          <span className="lumiere" />
          <CarteMembre f={f} photoUrl={photoUrl} role={role} telValide={telValide} pourcentage={pourcentage}
            astuce={ASTUCES[etape]} creeLe={user?.cree_le} />

          <section className="formulaire">
            <div className="etapes3">
              {['Toi', 'Où te joindre', 'Ton rôle'].map((libelle, k) => (
                <span key={libelle} style={{ display: 'contents' }}>
                  {k > 0 && <b className={k < etape ? 'plein' : ''} />}
                  <span className={pas(k + 1)}><i>{k + 1 < etape ? '✓' : k + 1}</i>{libelle}</span>
                </span>
              ))}
            </div>

            <div className="scene-etapes">
              <div className={`rideau ${nuages}`} aria-hidden="true"><i /><i /><i /><i /><i /></div>

              {etape === 1 && (
                <div className="etape on">
                  <h1>Fais-toi connaître</h1>
                  <p className="sous">Quelques infos pour que les autres te reconnaissent.</p>
                  <div className="ligne-photo">
                    <label className="depot">
                      <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={choisirPhoto} />
                      <span className="depot-rond">
                        {photoUrl ? <img src={photoUrl} alt="" /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>}
                      </span>
                      <span><b>{photo ? 'Changer la photo' : 'Ajouter une photo'}</b><small>JPG, PNG ou WEBP · 2 Mo max · facultatif</small></span>
                    </label>
                  </div>
                  <Erreur champ="photo" />
                  <div className="duo">
                    <div>
                      <div className={`champ ${erreurs.prenom ? 'erreur' : ''}`}>
                        <input placeholder="Prénom" autoComplete="given-name" value={f.prenom} onChange={changer('prenom')} />
                        <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
                      </div>
                      <Erreur champ="prenom" />
                    </div>
                    <div>
                      <div className={`champ sans-icone ${erreurs.nom ? 'erreur' : ''}`}>
                        <input placeholder="Nom" autoComplete="family-name" value={f.nom} onChange={changer('nom')} />
                      </div>
                      <Erreur champ="nom" />
                    </div>
                  </div>
                  <div className={`champ ${erreurs.username ? 'erreur' : ''}`}>
                    <input placeholder="Nom d'utilisateur" autoComplete="off" value={f.username} onChange={changer('username', nettoyerPseudo)} />
                    <span className="ic arobase">@</span>
                  </div>
                  <Erreur champ="username" />
                  <div className="suggestions">
                    {suggestions.map((s) => (
                      <button key={s} type="button" onClick={() => setF((v) => ({ ...v, username: s }))}>@{s}</button>
                    ))}
                  </div>
                  <button type="button" className="envoyer" onClick={() => continuer(1)}><span>Continuer</span><Fleche /></button>
                </div>
              )}

              {etape === 2 && (
                <div className="etape on">
                  <h1>Où te joindre ?</h1>
                  <p className="sous">Ton numéro reste privé jusqu'à une réservation.</p>
                  <div className={`champ tel ${erreurs.telephone ? 'erreur' : ''}`} style={{ marginTop: 16 }}>
                    <span className="indicatif">🇸🇳 +221</span>
                    <input inputMode="numeric" autoComplete="tel-national" placeholder="77 123 45 67" value={f.telephone} onChange={changer('telephone', formaterTel)} />
                  </div>
                  <Erreur champ="telephone" />
                  <div className={`champ ${erreurs.ville ? 'erreur' : ''}`}>
                    <input list="villes-senegal" placeholder="Ville" value={f.ville} onChange={changer('ville')} />
                    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" /></svg>
                  </div>
                  <datalist id="villes-senegal">{VILLES.map((v) => <option key={v} value={v} />)}</datalist>
                  <Erreur champ="ville" />
                  <div className={`champ ${erreurs.localite ? 'erreur' : ''}`}>
                    <input placeholder="Quartier / localité" value={f.localite} onChange={changer('localite')} />
                    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
                  </div>
                  <Erreur champ="localite" />
                  <div className="deux-boutons">
                    <button type="button" className="retour-etape" onClick={() => aller(1)}>Retour</button>
                    <button type="button" className="envoyer" onClick={() => continuer(2)}><span>Continuer</span><Fleche /></button>
                  </div>
                </div>
              )}

              {etape === 3 && (
                <div className="etape on">
                  <h1>Que viens-tu faire ?</h1>
                  <p className="sous">Tu pourras toujours changer plus tard.</p>
                  <div className="roles">
                    {[
                      ['client', 'Je cherche', 'des prestataires près de chez moi', <><circle key="a" cx="11" cy="11" r="7" /><path key="b" d="m20 20-4-4" /></>],
                      ['prestataire', 'Je propose', 'mes services et je trouve des clients', <path key="c" d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />],
                    ].map(([valeur, titre, texte, icone]) => (
                      <label key={valeur} className="role">
                        <input type="radio" name="role" checked={role === valeur} onChange={() => { setRole(valeur); setErreurs((v) => ({ ...v, role: undefined })) }} />
                        <span className="role-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icone}</svg></span>
                        <b>{titre}</b><small>{texte}</small><i className="pastille">✓</i>
                      </label>
                    ))}
                  </div>
                  <Erreur champ="role" />
                  {erreurGenerale && <p className="alerte on" role="alert">{erreurGenerale}</p>}
                  <div className="deux-boutons">
                    <button type="button" className="retour-etape" onClick={() => aller(2)}>Retour</button>
                    <button type="button" className={`envoyer ${completer.isPending ? 'charge' : ''}`} disabled={completer.isPending} onClick={finir}>
                      <span>Terminer</span><Fleche d="M5 13l4 4L19 7" /><i className="rond" />
                    </button>
                  </div>
                </div>
              )}

              {etape === 4 && (
                <div className="etape on">
                  <div className="bravo"><span>✓</span></div>
                  <h1 style={{ textAlign: 'center' }}>Bienvenue, {f.prenom.trim() || 'toi'} !</h1>
                  <p className="sous" style={{ textAlign: 'center' }}>
                    Ton profil est prêt. {role === 'prestataire' && !suite ? 'Créons maintenant ton profil professionnel…' : "On t'emmène dans ton espace…"}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}