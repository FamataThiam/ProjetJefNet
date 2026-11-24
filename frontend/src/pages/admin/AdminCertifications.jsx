import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCertifications, useDecisionCertification, useLienJustificatif } from '../../api/admin'
import { messageErreur } from '../../api/erreurs'
import { EnTete, FenetreMotif, Filtres, Plus, Vide } from '../../components/admin/communs'
import Avatar from '../../components/membre/Avatar'
import useSession from '../../hooks/useSession'
import { droitsDe, dateCourte, ilYa } from '../../components/admin/outils'

const STATUTS = {
  EN_ATTENTE: ['En attente', 'att'], CERTIFIE: ['Certifié', 'ok'], REFUSE: ['Refusé', 'ko'], RETIRE: ['Retiré', 'gris'], NON_CERTIFIE: ['Non certifié', 'gris'],
}

// /admin/certifications : liste à gauche, dossier et justificatif à droite
export default function AdminCertifications() {
  const { user } = useSession()
  const { decider } = droitsDe(user)
  const [statut, setStatut] = useState('EN_ATTENTE')
  const liste = useCertifications(statut)
  const [choisiId, setChoisiId] = useState(null)
  const dossiers = (liste.data?.pages ?? []).flatMap((p) => p.data)
  const choisi = dossiers.find((d) => d.profil_id === choisiId) ?? dossiers[0]

  return (
    <main className="adm-contenu">
      <EnTete titre="Certifications" sous="Vérifie le justificatif avant d’accorder le badge." />
      <Filtres valeur={statut} onChange={(v) => { setStatut(v); setChoisiId(null) }}
        options={[['EN_ATTENTE', 'En attente'], ['CERTIFIE', 'Certifiés'], ['REFUSE', 'Refusés'], ['RETIRE', 'Retirés'], ['TOUS', 'Tous']]} />

      {liste.isPending && <div className="adm-cert"><div className="ep-squelette" style={{ height: 300 }} /><div className="ep-squelette" style={{ height: 500 }} /></div>}
      {liste.isError && <p className="rs-erreur">{messageErreur(liste.error)}</p>}
      {liste.isSuccess && dossiers.length === 0 && (
        <Vide titre={statut === 'EN_ATTENTE' ? 'Aucune demande en attente' : 'Aucun dossier dans cette catégorie'}>
          {statut === 'EN_ATTENTE' ? 'Les demandes de certification des prestataires apparaîtront ici.' : 'Change de filtre pour voir les autres dossiers.'}
        </Vide>
      )}

      {dossiers.length > 0 && (
        <div className="adm-cert">
          <div className="adm-carte adm-liste-c">
            {dossiers.map((d) => {
              const [libelle, ton] = STATUTS[d.statut] ?? [d.statut, 'gris']
              return (
                <button key={d.profil_id} type="button" className={`adm-ci ${choisi?.profil_id === d.profil_id ? 'on' : ''}`} onClick={() => setChoisiId(d.profil_id)}>
                  <Avatar nom={d.prestataire.nom} px={42} />
                  <span className="t"><b>{d.prestataire.nom}</b><small>{d.titre_professionnel} · {d.demandee_le ? `demandé ${ilYa(d.demandee_le)}` : 'pas de demande'}</small></span>
                  <span className={`adm-pastille ${ton}`}>{libelle}</span>
                </button>
              )
            })}
            <Plus requete={liste} />
          </div>
          {choisi && <Dossier key={choisi.profil_id} d={choisi} decider={decider} />}
        </div>
      )}
    </main>
  )
}

function Dossier({ d, decider }) {
  const lien = useLienJustificatif(d.profil_id, d.justificatif_envoye)
  const decision = useDecisionCertification()
  const [fenetre, setFenetre] = useState(null)   // 'refuser' | 'retirer'
  const [STATUT] = STATUTS[d.statut] ?? [d.statut]
  const pdf = lien.data?.url && !/\.(png|jpe?g)(\?|$)/i.test(lien.data.url)

  return (
    <section className="adm-carte adm-dossier">
      <div className="tete">
        <Avatar nom={d.prestataire.nom} px={60} />
        <div className="t"><h2>{d.prestataire.nom}</h2><p>{[d.titre_professionnel, d.prestataire.ville, d.prestataire.email].filter(Boolean).join(' · ')}</p></div>
        {d.prestataire.uuid && <Link to={`/prestataires/${d.prestataire.uuid}`} target="_blank" className="rs-btn clair petit">Voir le profil public</Link>}
      </div>

      <div className="adm-infos">
        <div><small>Expérience</small><b>{d.experience || '—'}</b></div>
        <div><small>Services actifs</small><b>{d.nombre_services_actifs}</b></div>
        <div><small>Téléphone</small><b>{d.prestataire.telephone || '—'}</b></div>
        <div><small>Demandée le</small><b>{dateCourte(d.demandee_le)}</b></div>
      </div>

      <div className="adm-justif">
        {!d.justificatif_envoye && <p className="ep-vide" style={{ textAlign: 'center', paddingTop: 120 }}>Aucun justificatif envoyé.</p>}
        {d.justificatif_envoye && lien.isPending && <div className="ep-squelette" style={{ height: '100%' }} />}
        {lien.isError && <p className="rs-erreur" style={{ margin: 16 }}>{messageErreur(lien.error)}</p>}
        {lien.data?.url && (pdf
          ? <iframe src={lien.data.url} title="Justificatif" />
          : <img src={lien.data.url} alt="Justificatif" />)}
        {lien.data?.url && <a href={lien.data.url} target="_blank" rel="noreferrer" className="rs-btn clair petit ouvrir">Ouvrir en grand</a>}
      </div>

      {d.statut === 'REFUSE' && d.motif_refus && <p className="rs-motif"><b>Motif du refus : </b>{d.motif_refus}</p>}
      {d.traitee_le && <p className="rs-aide">{STATUT} le {dateCourte(d.traitee_le)}{d.traitee_par ? ` par ${d.traitee_par}` : ''}.</p>}

      {decision.isError && !fenetre && <p className="rs-erreur">{messageErreur(decision.error)}</p>}
      {decision.isSuccess && !fenetre && <p className="rs-ok">{decision.data?.message ?? 'Décision enregistrée.'}</p>}

      {decider ? (
        <div className="adm-actions">
          {d.statut === 'EN_ATTENTE' && (
            <>
              <button type="button" className="rs-btn plein" disabled={decision.isPending || !d.justificatif_envoye}
                onClick={() => decision.mutate({ id: d.profil_id, action: 'valider' })}>{decision.isPending ? 'Un instant…' : 'Valider la certification'}</button>
              <button type="button" className="rs-btn rouge" disabled={decision.isPending} onClick={() => { decision.reset(); setFenetre('refuser') }}>Refuser avec un motif</button>
            </>
          )}
          {d.statut === 'CERTIFIE' && <button type="button" className="rs-btn rouge" onClick={() => { decision.reset(); setFenetre('retirer') }}>Retirer le badge</button>}
        </div>
      ) : <p className="rs-aide">Ton niveau d’accès permet de consulter les dossiers, pas de décider.</p>}

      {fenetre && (
        <FenetreMotif
          titre={fenetre === 'refuser' ? 'Refuser la certification' : 'Retirer le badge'} sousTitre={d.prestataire.nom}
          texte={fenetre === 'refuser' ? 'Le prestataire pourra envoyer un nouveau justificatif.' : 'Le badge disparaîtra de son profil, de la recherche et de la carte.'}
          bouton={fenetre === 'refuser' ? 'Refuser' : 'Retirer le badge'} mutation={decision}
          onValider={(motif) => decision.mutate({ id: d.profil_id, action: fenetre, motif }, { onSuccess: () => setFenetre(null) })}
          onFermer={() => { setFenetre(null); decision.reset() }} />
      )}
    </section>
  )
}