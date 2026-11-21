import { useMemo, useRef, useState } from 'react'
import Avatar from '../membre/Avatar'
import { erreursChamps, messageErreur } from '../../api/auth'
import { useChangerPhoto, useModifierProfil } from '../../api/compte'
import ChoixCouleur from './ChoixCouleur'
import Signature from './Signature'

const VILLES = ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Mbour', 'Touba', 'Diourbel', 'Kaolack', 'Saint-Louis',
  'Ziguinchor', 'Louga', 'Tambacounda', 'Kolda', 'Fatick', 'Kaffrine', 'Kédougou', 'Matam', 'Sédhiou']

// 771234567 → 77 123 45 67
const formaterTel = (t = '') => t.replace(/\D/g, '').slice(0, 9).replace(/^(\d{2})(\d{0,3})(\d{0,2})(\d{0,2}).*/, (_, a, b, c, d) => [a, b, c, d].filter(Boolean).join(' '))

const valeursDe = (user) => ({
  prenom: user?.prenom ?? '',
  nom: user?.nom ?? '',
  username: user?.membre?.username ?? '',
  telephone: formaterTel(user?.membre?.telephone ?? ''),
  ville: user?.membre?.ville ?? '',
  localite: user?.membre?.localite ?? '',
})

const moisDe = (iso) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '')

function Champ({ libelle, nom, valeurs, initiales, erreurs, onChange, aide, prefixe, ...props }) {
  const modifie = valeurs[nom] !== initiales[nom]
  return (
    <div className={`champ-espace ${erreurs[nom] ? 'erreur' : ''}`}>
      <label htmlFor={`c-${nom}`}>{libelle}</label>
      <div className={prefixe ? 'avec-prefixe' : ''}>
        {prefixe && <em>{prefixe}</em>}
        <input id={`c-${nom}`} value={valeurs[nom]} onChange={onChange(nom)} className={modifie ? 'modifie' : ''} {...props} />
      </div>
      {erreurs[nom] ? <small className="msg-erreur">{erreurs[nom]}</small> : aide && <small>{aide}</small>}
    </div>
  )
}

export default function MonCompte({ user, perso, onEssai }) {
  const initiales = useMemo(() => valeursDe(user), [user])
  const [valeurs, setValeurs] = useState(initiales)
  const [erreurs, setErreurs] = useState({})
  const [succes, setSucces] = useState('')
  const modifier = useModifierProfil()

  const changer = (nom) => (e) => {
    const v = nom === 'telephone' ? formaterTel(e.target.value) : nom === 'username' ? e.target.value.toLowerCase() : e.target.value
    setValeurs((f) => ({ ...f, [nom]: v }))
    setErreurs((x) => ({ ...x, [nom]: undefined }))
    setSucces('')
  }

  // seulement les champs qui ont changé (le backend accepte des champs facultatifs)
  const modifies = Object.keys(valeurs).filter((k) => valeurs[k] !== initiales[k])

  const annuler = () => { setValeurs(initiales); setErreurs({}) }

  const enregistrer = (e) => {
    e.preventDefault()
    const champs = Object.fromEntries(modifies.map((k) => [k, k === 'telephone' ? valeurs[k].replace(/\s/g, '') : valeurs[k].trim()]))
    modifier.mutate(champs, {
      onSuccess: (data) => { setValeurs(valeursDe(data.user)); setSucces('Tes informations sont enregistrées.') },
      onError: (err) => setErreurs(erreursChamps(err)),
    })
  }

  // ----- photo -----
  const photo = useChangerPhoto()
  const choixPhoto = useRef(null)
  const [erreurPhoto, setErreurPhoto] = useState('')
  const changerPhoto = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return setErreurPhoto('Formats acceptés : JPG, PNG, WEBP.')
    if (f.size > 2 * 1024 * 1024) return setErreurPhoto("L'image ne doit pas dépasser 2 Mo.")
    setErreurPhoto('')
    photo.mutate(f, { onError: (err) => setErreurPhoto(messageErreur(err)) })
  }

  const nom = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim()
  const erreurGenerale = modifier.isError && !Object.keys(erreursChamps(modifier.error)).length ? messageErreur(modifier.error) : ''
  const proprietes = { valeurs, initiales, erreurs, onChange: changer }

  return (
    <>
      <div className="colonne">
        <form className="verre carte-espace" onSubmit={enregistrer} noValidate>
          <h2>Mes informations</h2>
          <p className="aide">Les autres membres voient ton nom, ton nom d'utilisateur et ta ville.</p>
          <div className="grille-champs">
            <Champ libelle="Prénom" nom="prenom" autoComplete="given-name" {...proprietes} />
            <Champ libelle="Nom" nom="nom" autoComplete="family-name" {...proprietes} />
            <Champ libelle="Nom d'utilisateur" nom="username" aide="Minuscules, chiffres, . - _ (3 à 30)" {...proprietes} />
            <Champ libelle="Téléphone" nom="telephone" prefixe="+221" inputMode="numeric" placeholder="77 123 45 67" {...proprietes} />
            <Champ libelle="Ville" nom="ville" list="villes-espace" {...proprietes} />
            <Champ libelle="Quartier / localité" nom="localite" {...proprietes} />
            <div className="champ-espace large">
              <label htmlFor="c-email">Adresse e-mail</label>
              <input id="c-email" value={user?.email ?? ''} disabled />
              <small>L'e-mail sert à te connecter : il ne se change pas ici.</small>
            </div>
          </div>
          <datalist id="villes-espace">{VILLES.map((v) => <option key={v} value={v} />)}</datalist>

          {erreurGenerale && <p className="msg-erreur">{erreurGenerale}</p>}
          {succes && !modifies.length && <p className="msg-ok">{succes}</p>}

          {modifies.length > 0 && (
            <div className="barre-enregistrer">
              <span>{modifies.length} modification{modifies.length > 1 ? 's' : ''} non enregistrée{modifies.length > 1 ? 's' : ''}</span>
              <button type="button" className="btn-sec" onClick={annuler} disabled={modifier.isPending}>Annuler</button>
              <button type="submit" className="btn-perso" disabled={modifier.isPending}>{modifier.isPending ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          )}
        </form>

        <Signature url={user?.membre?.signature_url} />
      </div>

      <div className="colonne">
        <section className="verre carte-identite">
          <button type="button" className="photo-modif" onClick={() => choixPhoto.current?.click()} disabled={photo.isPending}>
            <Avatar nom={nom} photo={user?.membre?.photo_url} couleur={perso} taille="a104" />
            <span className="voile">{photo.isPending ? 'Envoi…' : 'Changer la photo'}</span>
          </button>
          <input ref={choixPhoto} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={changerPhoto} />
          <b>{nom}</b>
          <small>@{user?.membre?.username}{user?.cree_le && ` · Membre depuis ${moisDe(user.cree_le)}`}</small>
          <div className="puces-identite">
            <i>{user?.est_prestataire ? 'Prestataire' : 'Client'}</i>
            {user?.membre?.ville && <i>{[user.membre.localite, user.membre.ville].filter(Boolean).join(', ')}</i>}
          </div>
          {erreurPhoto && <p className="msg-erreur">{erreurPhoto}</p>}
          {photo.isSuccess && !erreurPhoto && <p className="msg-ok">Photo mise à jour.</p>}
        </section>

        <ChoixCouleur actuelle={perso} onEssai={onEssai} />
      </div>
    </>
  )
}