import { useEffect, useMemo, useRef, useState } from 'react'
import { useDomainesAdmin, useEnregistrerDomaine, useEtatDomaine } from '../../api/admin'
import { erreursChamps, messageErreur } from '../../api/erreurs'
import { EnTete, Filtres, Vide } from '../../components/admin/communs'
import Modale from '../../components/reservations/Modale'
import useSession from '../../hooks/useSession'
import { droitsDe } from '../../components/admin/outils'

// /admin/domaines
export default function AdminDomaines() {
  const { user } = useSession()
  const { decider } = droitsDe(user)
  const [etat, setEtat] = useState('')
  const [saisie, setSaisie] = useState('')
  const [recherche, setRecherche] = useState('')
  const [fenetre, setFenetre] = useState(null)   // { domaine } ou { nouveau: true }
  const changerEtat = useEtatDomaine()
  useEffect(() => { const t = setTimeout(() => setRecherche(saisie.trim()), 400); return () => clearTimeout(t) }, [saisie])

  const domaines = useDomainesAdmin(etat, recherche)
  const liste = domaines.data ?? []

  return (
    <main className="adm-contenu">
      <EnTete titre="Domaines" sous="Les métiers proposés aux prestataires et aux clients.">
        <input className="rs-champ adm-recherche" type="search" placeholder="Rechercher un domaine…" value={saisie} onChange={(e) => setSaisie(e.target.value)} />
        {decider && <button type="button" className="rs-btn plein" onClick={() => setFenetre({ nouveau: true })}>Ajouter un domaine</button>}
      </EnTete>
      <Filtres valeur={etat} onChange={setEtat} options={[['', 'Tous'], ['ACTIF', 'Actifs'], ['INACTIF', 'Désactivés']]} />

      {changerEtat.isError && <p className="rs-erreur">{messageErreur(changerEtat.error)}</p>}
      {domaines.isPending && <div className="adm-doms">{[0, 1, 2, 3].map((k) => <div key={k} className="ep-squelette" style={{ height: 250 }} />)}</div>}
      {domaines.isError && <p className="rs-erreur">{messageErreur(domaines.error)}</p>}
      {domaines.isSuccess && liste.length === 0 && <Vide titre="Aucun domaine">Aucun domaine ne correspond à ta recherche.</Vide>}

      <div className="adm-doms">
        {liste.map((d) => (
          <article key={d.id} className={`adm-carte adm-dom ${d.est_actif ? '' : 'off'}`}>
            <div className="img">
              {d.image_url ? <img src={d.image_url} alt="" loading="lazy" /> : <span className="lettre">{d.libelle.charAt(0)}</span>}
              <span className={`adm-pastille ${d.est_actif ? 'ok' : 'gris'}`}>{d.est_actif ? 'Actif' : 'Désactivé'}</span>
            </div>
            <div className="t">
              <b>{d.libelle}</b>
              <p>{d.description || 'Pas de description.'}</p>
              <div className="stats"><span>{d.prestataires ?? 0} prestataire{d.prestataires > 1 ? 's' : ''}</span><span>{d.services_actifs ?? d.services ?? 0} service{(d.services_actifs ?? d.services) > 1 ? 's' : ''}</span><span>{d.demandes ?? 0} demande{d.demandes > 1 ? 's' : ''}</span></div>
              {decider && (
                <div className="acts">
                  <button type="button" className="adm-mini bleu" onClick={() => setFenetre({ domaine: d })}>Modifier</button>
                  {d.est_actif
                    ? <button type="button" className="adm-mini rouge" disabled={changerEtat.isPending} onClick={() => changerEtat.mutate({ id: d.id, action: 'desactiver' })}>Désactiver</button>
                    : <button type="button" className="adm-mini vert" disabled={changerEtat.isPending} onClick={() => changerEtat.mutate({ id: d.id, action: 'activer' })}>Réactiver</button>}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
      <p className="rs-aide" style={{ marginTop: 12 }}>Un domaine désactivé n’est plus proposé pour les nouveaux services et les nouvelles demandes. Ce qui existe déjà est conservé.</p>

      {fenetre && <FenetreDomaine domaine={fenetre.domaine} onFermer={() => setFenetre(null)} />}
    </main>
  )
}

function FenetreDomaine({ domaine, onFermer }) {
  const [libelle, setLibelle] = useState(domaine?.libelle ?? '')
  const [description, setDescription] = useState(domaine?.description ?? '')
  const [image, setImage] = useState(null)
  const [supprimerImage, setSupprimerImage] = useState(false)
  const [alerte, setAlerte] = useState('')
  const choix = useRef(null)
  const enregistrer = useEnregistrerDomaine()
  const erreurs = erreursChamps(enregistrer.error)
  const apercu = useMemo(() => (image ? URL.createObjectURL(image) : null), [image])
  useEffect(() => () => { if (apercu) URL.revokeObjectURL(apercu) }, [apercu])
  const src = apercu ?? (supprimerImage ? null : domaine?.image_url)

  const choisir = (f) => {
    setAlerte('')
    if (!f) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return setAlerte('Formats acceptés : JPG, PNG ou WEBP.')
    if (f.size > 2 * 1024 * 1024) return setAlerte('L’image ne doit pas dépasser 2 Mo.')
    setImage(f); setSupprimerImage(false)
  }

  return (
    <Modale titre={domaine ? 'Modifier le domaine' : 'Ajouter un domaine'} onFermer={onFermer}>
      <label className="ep-lbl haut" htmlFor="dom-lib">Nom</label>
      <input id="dom-lib" className="rs-champ" maxLength={100} value={libelle} placeholder="Ex. : Menuiserie" onChange={(e) => setLibelle(e.target.value)} />
      {erreurs.libelle && <p className="rs-champ-err">{erreurs.libelle}</p>}
      <label className="ep-lbl" htmlFor="dom-desc">Description (facultative)</label>
      <textarea id="dom-desc" className="rs-champ" rows={3} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} />
      <span className="ep-lbl">Image (facultative, 2 Mo maximum)</span>
      <div className="adm-image">
        <button type="button" className="vignette" onClick={() => choix.current?.click()}>
          {src ? <img src={src} alt="" /> : <span>Choisir une image</span>}
        </button>
        <div>
          <button type="button" className="rs-btn clair petit" onClick={() => choix.current?.click()}>{src ? 'Changer' : 'Choisir'}</button>
          {src && <button type="button" className="rs-btn contour petit" style={{ marginLeft: 8 }} onClick={() => { setImage(null); setSupprimerImage(Boolean(domaine?.image_url)) }}>Retirer</button>}
        </div>
      </div>
      <input ref={choix} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => { choisir(e.target.files?.[0]); e.target.value = '' }} />
      {(alerte || erreurs.image) && <p className="rs-champ-err">{alerte || erreurs.image}</p>}
      {enregistrer.isError && !Object.keys(erreurs).length && <p className="rs-erreur">{messageErreur(enregistrer.error)}</p>}
      <div className="rs-pied">
        <button type="button" className="rs-btn contour" onClick={onFermer}>Annuler</button>
        <button type="button" className="rs-btn plein" disabled={libelle.trim().length < 3 || enregistrer.isPending}
          onClick={() => enregistrer.mutate({ id: domaine?.id, libelle: libelle.trim(), description: description.trim(), image, supprimerImage }, { onSuccess: onFermer })}>
          {enregistrer.isPending ? 'Enregistrement…' : domaine ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </Modale>
  )
}