import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { erreursChamps, messageErreur } from '../../api/auth'
import { useChangerMotDePasse, useDesactiverCompte } from '../../api/compte'
import useSession from '../../hooks/useSession'


function forceDe(mdp) {
  if (!mdp) return 0
  return [mdp.length >= 8, /[a-z]/i.test(mdp) && /\d/.test(mdp), /[A-Z]/.test(mdp) && /[a-z]/.test(mdp), /[^a-z0-9]/i.test(mdp) || mdp.length >= 12]
    .filter(Boolean).length
}
const LIBELLES_FORCE = ['', 'Faible', 'Moyen', 'Bon', 'Excellent']

function ChangerMotDePasse({ sansMotDePasse }) {
  const vide = { mot_de_passe_actuel: '', password: '', password_confirmation: '' }
  const [f, setF] = useState(vide)
  const [erreurs, setErreurs] = useState({})
  const [voir, setVoir] = useState(false)
  const changerMdp = useChangerMotDePasse()

  const changer = (nom) => (e) => {
    setF((x) => ({ ...x, [nom]: e.target.value }))
    setErreurs((x) => ({ ...x, [nom]: undefined }))
    changerMdp.reset()
  }

  const envoyer = (e) => {
    e.preventDefault()
    const err = {}
    if (!sansMotDePasse && !f.mot_de_passe_actuel) err.mot_de_passe_actuel = 'Ton mot de passe actuel est obligatoire.'
    if (f.password.length < 8) err.password = 'Au moins 8 caractères.'
    else if (!/[a-z]/i.test(f.password) || !/\d/.test(f.password)) err.password = 'Au moins une lettre et un chiffre.'
    if (f.password !== f.password_confirmation) err.password_confirmation = 'La confirmation ne correspond pas.'
    if (Object.keys(err).length) return setErreurs(err)

    const champs = sansMotDePasse ? { password: f.password, password_confirmation: f.password_confirmation } : f
    changerMdp.mutate(champs, {
      onSuccess: () => setF(vide),
      onError: (er) => setErreurs(erreursChamps(er)),
    })
  }

  const force = forceDe(f.password)
  const type = voir ? 'text' : 'password'
  const erreurGenerale = changerMdp.isError && !Object.keys(erreursChamps(changerMdp.error)).length ? messageErreur(changerMdp.error) : ''

  return (
    <form className="verre carte-espace" onSubmit={envoyer} noValidate>
      <h2>{sansMotDePasse ? 'Créer un mot de passe' : 'Changer mon mot de passe'}</h2>
      <p className="aide">
        {sansMotDePasse ? 'Tu te connectes avec un compte externe. Un mot de passe te permettra aussi de te connecter avec ton e-mail.'
          : 'Tes autres appareils seront déconnectés.'}
      </p>
      <div className="grille-champs">
        {!sansMotDePasse && (
          <div className={`champ-espace large ${erreurs.mot_de_passe_actuel ? 'erreur' : ''}`}>
            <label htmlFor="mdp-actuel">Mot de passe actuel</label>
            <input id="mdp-actuel" type={type} autoComplete="current-password" value={f.mot_de_passe_actuel} onChange={changer('mot_de_passe_actuel')} />
            {erreurs.mot_de_passe_actuel && <small className="msg-erreur">{erreurs.mot_de_passe_actuel}</small>}
          </div>
        )}
        <div className={`champ-espace ${erreurs.password ? 'erreur' : ''}`}>
          <label htmlFor="mdp-nouveau">Nouveau mot de passe</label>
          <input id="mdp-nouveau" type={type} autoComplete="new-password" value={f.password} onChange={changer('password')} />
          <div className={`force f${force}`}>{[1, 2, 3, 4].map((i) => <i key={i} className={i <= force ? 'pleine' : ''} />)}</div>
          {erreurs.password ? <small className="msg-erreur">{erreurs.password}</small> : <small>{LIBELLES_FORCE[force] || '8 caractères, avec lettres et chiffres'}</small>}
        </div>
        <div className={`champ-espace ${erreurs.password_confirmation ? 'erreur' : ''}`}>
          <label htmlFor="mdp-confirmation">Confirmation</label>
          <input id="mdp-confirmation" type={type} autoComplete="new-password" value={f.password_confirmation} onChange={changer('password_confirmation')} />
          {erreurs.password_confirmation && <small className="msg-erreur">{erreurs.password_confirmation}</small>}
        </div>
      </div>

      {erreurGenerale && <p className="msg-erreur">{erreurGenerale}</p>}
      {changerMdp.isSuccess && <p className="msg-ok">{changerMdp.data?.message ?? 'Mot de passe modifié.'}</p>}

      <div className="pied-carte entre">
        <label className="voir-mdp"><input type="checkbox" checked={voir} onChange={(e) => setVoir(e.target.checked)} /> Afficher</label>
        <button type="submit" className="btn-perso" disabled={changerMdp.isPending}>
          {changerMdp.isPending ? 'Enregistrement…' : sansMotDePasse ? 'Créer le mot de passe' : 'Changer le mot de passe'}
        </button>
      </div>
    </form>
  )
}

function Desactiver({ sansMotDePasse }) {
  const [ouvert, setOuvert] = useState(false)
  const [valeur, setValeur] = useState('')
  const desactiver = useDesactiverCompte()
  const { fermer } = useSession()
  const navigate = useNavigate()

  const confirmer = (e) => {
    e.preventDefault()
    desactiver.mutate(valeur, {
      onSuccess: async () => { await fermer(); navigate('/', { replace: true }) },
    })
  }

  return (
    <section className="verre carte-espace zone-sensible">
      <h2>Zone sensible</h2>
      <p className="aide">
        Désactiver mon compte : tu ne pourras plus te connecter. Pour le réactiver, il faudra contacter l'administration JefNet.
      </p>
      {!ouvert ? (
        <div className="pied-carte"><button type="button" className="btn-danger" onClick={() => setOuvert(true)}>Désactiver mon compte</button></div>
      ) : (
        <form onSubmit={confirmer} className="confirmer-desactivation">
          <label htmlFor="desactiver">
            {sansMotDePasse ? <>Tape <b>DESACTIVER</b> pour confirmer</> : 'Ton mot de passe pour confirmer'}
          </label>
          <input id="desactiver" type={sansMotDePasse ? 'text' : 'password'} value={valeur} autoFocus
            onChange={(e) => { setValeur(e.target.value); desactiver.reset() }} />
          {desactiver.isError && <small className="msg-erreur">{messageErreur(desactiver.error)}</small>}
          <div className="pied-carte">
            <button type="button" className="btn-sec" onClick={() => { setOuvert(false); setValeur(''); desactiver.reset() }}>Annuler</button>
            <button type="submit" className="btn-danger plein" disabled={!valeur || desactiver.isPending}>
              {desactiver.isPending ? 'Désactivation…' : 'Confirmer la désactivation'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

export default function Securite({ user }) {

  const sansMotDePasse = Boolean(user?.provider) && user?.a_mot_de_passe === false
  return (
    <>
      <div className="colonne"><ChangerMotDePasse sansMotDePasse={sansMotDePasse} /></div>
      <div className="colonne"><Desactiver sansMotDePasse={sansMotDePasse} /></div>
    </>
  )
}