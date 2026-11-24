import { useEffect, useMemo, useRef, useState } from 'react'
import { useEnregistrerPublication } from '../../api/espacePro'
import { erreursChamps, messageErreur } from '../../api/erreurs'
import Modale from '../reservations/Modale'
import '../reservations/reservations.css'
import './espace-pro.css'

const MAX_MEDIAS = 4
const MAX_IMAGE = 5 * 1024 * 1024
const MAX_VIDEO = 20 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4']


export default function FenetrePublication({ publication, onFermer, onPubliee }) {
  const [titre, setTitre] = useState(publication?.titre ?? '')
  const [description, setDescription] = useState(publication?.description ?? '')
  const [fichiers, setFichiers] = useState([])         
  const [aSupprimer, setASupprimer] = useState([])      
  const [alerte, setAlerte] = useState('')
  const choix = useRef(null)
  const enregistrer = useEnregistrerPublication(publication?.id)

  const existants = (publication?.medias ?? []).filter((m) => !aSupprimer.includes(m.id))
  const apercus = useMemo(() => fichiers.map((f) => ({ f, url: URL.createObjectURL(f), video: f.type.startsWith('video/') })), [fichiers])
  useEffect(() => () => apercus.forEach((a) => URL.revokeObjectURL(a.url)), [apercus])

  const total = existants.length + fichiers.length
  const videos = existants.filter((m) => m.type === 'VIDEO').length + fichiers.filter((f) => f.type.startsWith('video/')).length

  const ajouter = (liste) => {
    setAlerte('')
    const nouveaux = []
    let nbVideos = videos
    for (const f of liste) {
      if (!TYPES.includes(f.type)) { setAlerte('Formats acceptés : JPG, PNG, WEBP ou vidéo MP4.'); continue }
      const video = f.type.startsWith('video/')
      if (video && f.size > MAX_VIDEO) { setAlerte('Une vidéo ne doit pas dépasser 20 Mo.'); continue }
      if (!video && f.size > MAX_IMAGE) { setAlerte('Une photo ne doit pas dépasser 5 Mo.'); continue }
      if (video && nbVideos >= 1) { setAlerte('Une seule vidéo par réalisation.'); continue }
      if (total + nouveaux.length >= MAX_MEDIAS) { setAlerte(`${MAX_MEDIAS} photos ou vidéos au maximum.`); break }
      if (video) nbVideos++
      nouveaux.push(f)
    }
    setFichiers((x) => [...x, ...nouveaux])
  }

  const erreurs = erreursChamps(enregistrer.error)
  const pret = titre.trim().length >= 3 && (total > 0 || description.trim())

  const envoyer = () => enregistrer.mutate(
    { titre: titre.trim(), description: description.trim(), fichiers, aSupprimer },
    { onSuccess: () => { onPubliee?.(); onFermer() } },
  )

  return (
    <Modale large titre={publication ? 'Modifier la réalisation' : 'Publier une réalisation'}
      sousTitre={publication ? 'Les clients verront la nouvelle version tout de suite.' : 'Elle apparaîtra sur ton profil et dans le fil des clients.'} onFermer={onFermer}>
      <label className="ep-lbl haut" htmlFor="pub-titre">Titre</label>
      <input id="pub-titre" className="rs-champ" maxLength={150} value={titre} placeholder="Ex. : Rénovation complète d’une salle de bain" onChange={(e) => setTitre(e.target.value)} />
      {erreurs.titre && <p className="rs-champ-err">{erreurs.titre}</p>}

      <label className="ep-lbl" htmlFor="pub-desc">Description (facultative)</label>
      <textarea id="pub-desc" className="rs-champ" rows={4} maxLength={3000} value={description} onChange={(e) => setDescription(e.target.value)}
        placeholder="Ce que tu as fait, le matériel utilisé, la durée du chantier…" />

      <span className="ep-lbl">Photos ou vidéo <small>{total} / {MAX_MEDIAS} · 1 vidéo maximum</small></span>
      <div className="ep-medias"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); ajouter([...e.dataTransfer.files]) }}>
        {existants.map((m) => (
          <figure key={`e${m.id}`} className="ep-media">
            {m.type === 'VIDEO' ? <video src={m.url} muted /> : <img src={m.url} alt="" />}
            {m.type === 'VIDEO' && <em>Vidéo</em>}
            <button type="button" aria-label="Retirer" onClick={() => setASupprimer((x) => [...x, m.id])}>×</button>
          </figure>
        ))}
        {apercus.map((a, k) => (
          <figure key={a.url} className="ep-media">
            {a.video ? <video src={a.url} muted /> : <img src={a.url} alt="" />}
            {a.video && <em>Vidéo</em>}
            <button type="button" aria-label="Retirer" onClick={() => setFichiers((x) => x.filter((_, i) => i !== k))}>×</button>
          </figure>
        ))}
        {total < MAX_MEDIAS && (
          <button type="button" className="ep-media ajout" onClick={() => choix.current?.click()}>
            <b>+</b>Ajouter<small>ou glisse ici</small>
          </button>
        )}
      </div>
      <input ref={choix} type="file" hidden multiple accept={TYPES.join(',')} onChange={(e) => { ajouter([...e.target.files]); e.target.value = '' }} />
      <p className="rs-aide">Photos : 5 Mo maximum chacune. Vidéo MP4 : 20 Mo maximum.</p>
      {alerte && <p className="rs-champ-err">{alerte}</p>}
      {(erreurs.medias || Object.keys(erreurs).find((k) => k.startsWith('medias.'))) && <p className="rs-champ-err">{erreurs.medias || erreurs[Object.keys(erreurs).find((k) => k.startsWith('medias.'))]}</p>}
      {enregistrer.isError && !Object.keys(erreurs).length && <p className="rs-erreur">{messageErreur(enregistrer.error)}</p>}

      <div className="rs-pied">
        <button type="button" className="rs-btn contour" onClick={onFermer}>Annuler</button>
        <button type="button" className="rs-btn plein" disabled={!pret || enregistrer.isPending} onClick={envoyer}>
          {enregistrer.isPending ? 'Envoi…' : publication ? 'Enregistrer' : 'Publier'}
        </button>
      </div>
    </Modale>
  )
}