import { useState } from 'react'
import { erreursChamps, messageErreur } from '../../api/erreurs'
import Modale from '../reservations/Modale'

export function EnTete({ titre, sous, children }) {
  return (
    <div className="adm-tete">
      <div><h1>{titre}</h1>{sous && <p>{sous}</p>}</div>
      {children && <div className="droite">{children}</div>}
    </div>
  )
}

// pastilles de filtre : options = [[valeur, libellé, compteur?], …]
export function Filtres({ options, valeur, onChange }) {
  return (
    <div className="adm-filtres">
      {options.map(([v, l, n]) => (
        <button key={v || 'tous'} type="button" className={valeur === v ? 'on' : ''} onClick={() => onChange(v)}>
          {l}{n !== undefined && n !== null && <i>{n}</i>}
        </button>
      ))}
    </div>
  )
}

export function Plus({ requete }) {
  if (!requete.hasNextPage) return null
  return (
    <div className="rs-plus">
      <button type="button" className="rs-btn contour" disabled={requete.isFetchingNextPage} onClick={() => requete.fetchNextPage()}>
        {requete.isFetchingNextPage ? 'Chargement…' : 'Voir plus'}
      </button>
    </div>
  )
}

export function Vide({ titre, children }) {
  return <div className="adm-carte adm-vide"><b>{titre}</b>{children}</div>
}

// fenêtre de décision avec un motif obligatoire (10 à 500 caractères, comme le backend)
export function FenetreMotif({ titre, sousTitre, texte, bouton, mutation, onValider, onFermer }) {
  const [motif, setMotif] = useState('')
  const ok = motif.trim().length >= 10
  const erreurs = erreursChamps(mutation.error)
  return (
    <Modale titre={titre} sousTitre={sousTitre} onFermer={onFermer}>
      {texte && <p className="rs-aide" style={{ marginTop: 0, fontSize: 14 }}>{texte}</p>}
      <label className="ep-lbl" htmlFor="motif">Motif (envoyé à la personne concernée)</label>
      <textarea id="motif" className="rs-champ" rows={4} maxLength={500} value={motif} onChange={(e) => setMotif(e.target.value)} />
      <p className="rs-aide">{ok ? `${motif.length} / 500` : `Au moins 10 caractères (${motif.trim().length}/10).`}</p>
      {mutation.isError && <p className="rs-erreur">{erreurs.motif || messageErreur(mutation.error)}</p>}
      <div className="rs-pied">
        <button type="button" className="rs-btn contour" onClick={onFermer}>Annuler</button>
        <button type="button" className="rs-btn rouge" disabled={!ok || mutation.isPending} onClick={() => onValider(motif.trim())}>
          {mutation.isPending ? 'Un instant…' : bouton}
        </button>
      </div>
    </Modale>
  )
}