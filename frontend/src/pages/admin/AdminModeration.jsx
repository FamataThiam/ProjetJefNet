import { useState } from 'react'
import { useCommentairesAdmin, useModerer, usePublicationsAdmin, useSupprimerCommentaire } from '../../api/admin'
import { messageErreur } from '../../api/erreurs'
import { EnTete, FenetreMotif, Filtres, Plus, Vide } from '../../components/admin/communs'
import Modale from '../../components/reservations/Modale'


export default function AdminModeration() {
  const [etat, setEtat] = useState('VISIBLE')
  const liste = usePublicationsAdmin(etat)
  const moderer = useModerer()
  const [ouverte, setOuverte] = useState(null)
  const [aMasquer, setAMasquer] = useState(null)
  const pubs = (liste.data?.pages ?? []).flatMap((p) => p.data)
  const total = liste.data?.pages[0]?.meta?.total

  return (
    <main className="adm-contenu">
      <EnTete titre="Modération" sous="Masque une publication qui ne respecte pas les règles. Elle reste visible pour son auteur, qui est prévenu avec le motif." />
      <Filtres valeur={etat} onChange={setEtat} options={[['VISIBLE', 'Visibles', etat === 'VISIBLE' ? total : undefined], ['MASQUEE', 'Masquées', etat === 'MASQUEE' ? total : undefined]]} />

      {moderer.isError && !aMasquer && <p className="rs-erreur">{messageErreur(moderer.error)}</p>}
      {moderer.isSuccess && !aMasquer && <p className="rs-ok">{moderer.data?.message ?? 'Fait.'}</p>}

      {liste.isPending && <div className="adm-mods">{[0, 1, 2].map((k) => <div key={k} className="ep-squelette" style={{ height: 280 }} />)}</div>}
      {liste.isError && <p className="rs-erreur">{messageErreur(liste.error)}</p>}
      {liste.isSuccess && pubs.length === 0 && <Vide titre={etat === 'MASQUEE' ? 'Aucune publication masquée' : 'Aucune publication'}>{etat === 'MASQUEE' ? 'Les publications que tu masques apparaîtront ici.' : 'Les réalisations des prestataires apparaîtront ici.'}</Vide>}

      <div className="adm-mods">
        {pubs.map((p) => {
          const couv = p.medias?.[0]
          return (
            <article key={p.id} className="adm-carte adm-mod">
              <div className="img">
                {couv ? (couv.type === 'VIDEO' ? <video src={couv.url} muted preload="metadata" /> : <img src={couv.url} alt="" loading="lazy" />) : <span className="sans">Sans photo</span>}
                {p.medias?.length > 0 && <em>{p.medias.length} média{p.medias.length > 1 ? 's' : ''}</em>}
                {!p.est_active && <span className="masq">Masquée</span>}
              </div>
              <div className="t">
                <b>{p.titre}</b>
                <small>{p.prestataire?.nom} · {p.il_y_a} · {p.nb_commentaires} commentaire{p.nb_commentaires > 1 ? 's' : ''}</small>
                <div className="acts">
                  <button type="button" className="adm-mini bleu" onClick={() => setOuverte(p)}>Ouvrir</button>
                  {p.est_active
                    ? <button type="button" className="adm-mini rouge" onClick={() => { moderer.reset(); setAMasquer(p) }}>Masquer</button>
                    : <button type="button" className="adm-mini vert" disabled={moderer.isPending} onClick={() => moderer.mutate({ id: p.id, action: 'reafficher' })}>Réafficher</button>}
                </div>
              </div>
            </article>
          )
        })}
      </div>
      <Plus requete={liste} />

      {ouverte && <Apercu p={ouverte} onFermer={() => setOuverte(null)} />}
      {aMasquer && (
        <FenetreMotif titre="Masquer la publication" sousTitre={`${aMasquer.titre} · ${aMasquer.prestataire?.nom}`}
          texte="Elle disparaîtra du fil et du profil public. Le prestataire sera prévenu avec ton motif."
          bouton="Masquer" mutation={moderer}
          onValider={(motif) => moderer.mutate({ id: aMasquer.id, action: 'masquer', motif }, { onSuccess: () => setAMasquer(null) })}
          onFermer={() => { setAMasquer(null); moderer.reset() }} />
      )}
    </main>
  )
}


function Apercu({ p, onFermer }) {
  const commentaires = useCommentairesAdmin(p.id)
  const supprimer = useSupprimerCommentaire()
  const [aSupprimer, setASupprimer] = useState(null)
  const tous = (commentaires.data ?? []).flatMap((c) => [c, ...(c.reponses ?? []).map((r) => ({ ...r, reponse: true }))])

  return (
    <Modale large titre={p.titre} sousTitre={`${p.prestataire?.nom} · ${p.il_y_a}`} onFermer={onFermer}>
      {p.medias?.length > 0 && (
        <div className="adm-medias">
          {p.medias.map((m) => (m.type === 'VIDEO' ? <video key={m.id} src={m.url} controls /> : <img key={m.id} src={m.url} alt="" />))}
        </div>
      )}
      {p.description && <p className="rs-texte-rapport" style={{ marginTop: 14 }}>{p.description}</p>}

      <span className="ep-lbl">Commentaires</span>
      {commentaires.isPending && <div className="ep-squelette" style={{ height: 80 }} />}
      {commentaires.isError && <p className="rs-erreur">{messageErreur(commentaires.error)}</p>}
      {commentaires.isSuccess && tous.length === 0 && <p className="rs-aide" style={{ marginTop: 0 }}>Aucun commentaire.</p>}
      {tous.map((c) => (
        <div key={c.id} className={`adm-com ${c.reponse ? 'rep' : ''}`}>
          <div><b>{c.auteur?.nom}</b><small> · {c.il_y_a}</small><p>{c.contenu}</p></div>
          {aSupprimer === c.id ? (
            <span className="conf">
              <button type="button" className="adm-mini rouge" disabled={supprimer.isPending} onClick={() => supprimer.mutate(c.id, { onSuccess: () => setASupprimer(null) })}>Confirmer</button>
              <button type="button" className="adm-mini" onClick={() => setASupprimer(null)}>Annuler</button>
            </span>
          ) : <button type="button" className="adm-mini rouge" onClick={() => setASupprimer(c.id)}>Supprimer</button>}
        </div>
      ))}
      {supprimer.isError && <p className="rs-erreur">{messageErreur(supprimer.error)}</p>}
    </Modale>
  )
}