import { useState } from 'react'
import { useMesPublications, useSupprimerPublication } from '../../api/espacePro'
import { messageErreur } from '../../api/erreurs'
import Modale from '../reservations/Modale'
import FenetrePublication from './FenetrePublication'


export default function Realisations({ ouvrirAuDepart = false, onOuverte }) {
  const liste = useMesPublications()
  const supprimer = useSupprimerPublication()
  const [fenetre, setFenetre] = useState(ouvrirAuDepart ? { nouvelle: true } : null)
  const [aSupprimer, setASupprimer] = useState(null)
  const pubs = (liste.data?.pages ?? []).flatMap((p) => p.data)
  const total = liste.data?.pages[0]?.meta.total ?? 0

  const fermer = () => { setFenetre(null); onOuverte?.() }

  return (
    <>
      <div className="ep-outils">
        <h2>Mes réalisations</h2>
        <span>{total ? `${total} publiée${total > 1 ? 's' : ''} · visibles sur ton profil et dans le fil` : 'Visibles sur ton profil et dans le fil des clients'}</span>
        <button type="button" className="rs-btn plein" onClick={() => setFenetre({ nouvelle: true })}>Publier une réalisation</button>
      </div>

      {liste.isPending && <div className="ep-pubs">{[0, 1, 2].map((k) => <div key={k} className="ep-squelette" style={{ height: 290 }} />)}</div>}
      {liste.isError && <div className="verre ep-bientot"><b>Chargement impossible</b>{messageErreur(liste.error)}</div>}
      {liste.isSuccess && pubs.length === 0 && (
        <div className="verre ep-bientot">
          <b>Aucune réalisation pour le moment</b>
          Montre ton travail : une photo avant et après rassure les clients et te fait apparaître dans leur fil.
          <div style={{ marginTop: 16 }}><button type="button" className="rs-btn clair" onClick={() => setFenetre({ nouvelle: true })}>Publier ma première réalisation</button></div>
        </div>
      )}

      <div className="ep-pubs">
        {pubs.map((p, k) => {
          const couverture = p.medias?.[0]
          const nbPhotos = p.medias?.filter((m) => m.type === 'IMAGE').length ?? 0
          const video = p.medias?.some((m) => m.type === 'VIDEO')
          return (
            <article key={p.id} className={`verre ep-pub ${p.est_active ? '' : 'masquee'}`} style={{ animationDelay: `${Math.min(k, 8) * 40}ms` }}>
              <div className="img">
                {couverture ? (couverture.type === 'VIDEO' ? <video src={couverture.url} muted preload="metadata" /> : <img src={couverture.url} alt="" loading="lazy" />)
                  : <span className="sans">Sans photo</span>}
                {(nbPhotos > 0 || video) && <em>{[nbPhotos && `${nbPhotos} photo${nbPhotos > 1 ? 's' : ''}`, video && 'vidéo'].filter(Boolean).join(' + ')}</em>}
                {!p.est_active && <strong>Masquée par la modération</strong>}
              </div>
              <div className="txt">
                <b>{p.titre}</b>
                <small>Publiée {p.il_y_a}</small>
                <div className="stats">
                  <span>{p.nb_commentaires} commentaire{p.nb_commentaires > 1 ? 's' : ''}</span>
                  <button type="button" className="rs-lien" onClick={() => setFenetre({ publication: p })}>Modifier</button>
                  <button type="button" className="rs-lien rouge" onClick={() => setASupprimer(p)}>Supprimer</button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {liste.hasNextPage && (
        <div className="rs-plus"><button type="button" className="rs-btn contour" disabled={liste.isFetchingNextPage} onClick={() => liste.fetchNextPage()}>{liste.isFetchingNextPage ? 'Chargement…' : 'Voir plus'}</button></div>
      )}

      {fenetre && <FenetrePublication publication={fenetre.publication} onFermer={fermer} />}

      {aSupprimer && (
        <Modale titre="Supprimer la réalisation ?" sousTitre={aSupprimer.titre} onFermer={() => { setASupprimer(null); supprimer.reset() }}>
          <p className="rs-aide" style={{ marginTop: 0, fontSize: 14 }}>Elle disparaîtra de ton profil et du fil, avec ses photos et ses commentaires. Cette action est définitive.</p>
          {supprimer.isError && <p className="rs-erreur">{messageErreur(supprimer.error)}</p>}
          <div className="rs-pied">
            <button type="button" className="rs-btn contour" onClick={() => setASupprimer(null)}>Garder</button>
            <button type="button" className="rs-btn rouge" disabled={supprimer.isPending} onClick={() => supprimer.mutate(aSupprimer.id, { onSuccess: () => setASupprimer(null) })}>
              {supprimer.isPending ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </Modale>
      )}
    </>
  )
}