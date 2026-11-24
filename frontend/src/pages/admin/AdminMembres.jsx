import { useEffect, useState } from 'react'
import { useActionMembre, useMembreAdmin, useMembresAdmin } from '../../api/admin'
import { messageErreur } from '../../api/erreurs'
import { EnTete, FenetreMotif, Filtres, Plus, Vide } from '../../components/admin/communs'
import Avatar from '../../components/membre/Avatar'
import Modale from '../../components/reservations/Modale'
import useSession from '../../hooks/useSession'
import { droitsDe, dateCourte, ilYa } from '../../components/admin/outils'

const STATUTS = { ACTIF: ['Actif', 'ok'], BLOQUE: ['Suspendu', 'ko'], INACTIF: ['Inactif', 'gris'], SIGNALE: ['Signalé', 'att'] }

// /admin/membres
export default function AdminMembres() {
  const { user } = useSession()
  const { decider } = droitsDe(user)
  const [saisie, setSaisie] = useState('')
  const [recherche, setRecherche] = useState('')
  const [role, setRole] = useState('')
  const [statut, setStatut] = useState('')
  const [ouvert, setOuvert] = useState(null)
  const [aSuspendre, setASuspendre] = useState(null)
  const action = useActionMembre()

  // la recherche part 400 ms après la dernière touche
  useEffect(() => { const t = setTimeout(() => setRecherche(saisie.trim()), 400); return () => clearTimeout(t) }, [saisie])

  const liste = useMembresAdmin({ recherche: recherche || undefined, role: role || undefined, statut: statut || undefined })
  const membres = (liste.data?.pages ?? []).flatMap((p) => p.data)
  const total = liste.data?.pages[0]?.meta?.total

  return (
    <main className="adm-contenu">
      <EnTete titre="Membres" sous={total !== undefined ? `${total} membre${total > 1 ? 's' : ''} pour ces filtres` : ' '}>
        <input className="rs-champ adm-recherche" type="search" placeholder="Rechercher un nom, un e-mail, une ville…" value={saisie} onChange={(e) => setSaisie(e.target.value)} />
      </EnTete>
      <div className="adm-filtres-ligne">
        <Filtres valeur={role} onChange={setRole} options={[['', 'Tous'], ['CLIENT', 'Clients'], ['PRESTATAIRE', 'Prestataires']]} />
        <Filtres valeur={statut} onChange={setStatut} options={[['', 'Tous les statuts'], ['ACTIF', 'Actifs'], ['BLOQUE', 'Suspendus']]} />
      </div>

      {action.isError && !aSuspendre && <p className="rs-erreur">{messageErreur(action.error)}</p>}
      {action.isSuccess && !aSuspendre && <p className="rs-ok">{action.data?.message ?? 'Fait.'}</p>}

      {liste.isPending && <div className="ep-squelette" style={{ height: 360 }} />}
      {liste.isError && <p className="rs-erreur">{messageErreur(liste.error)}</p>}
      {liste.isSuccess && membres.length === 0 && <Vide titre="Aucun membre trouvé">Essaie une autre recherche ou un autre filtre.</Vide>}

      {membres.length > 0 && (
        <div className="adm-carte adm-table">
          <table>
            <thead><tr><th>Membre</th><th>Ville</th><th>Rôle</th><th>Inscrit</th><th>Dernière connexion</th><th>Statut</th><th /></tr></thead>
            <tbody>
              {membres.map((m) => {
                const [libelle, ton] = STATUTS[m.statut_compte] ?? [m.statut_compte ?? '—', 'gris']
                return (
                  <tr key={m.membre_id} onClick={() => setOuvert(m.membre_id)}>
                    <td><div className="adm-qui"><Avatar nom={m.nom} photo={m.photo_url} px={34} /><span><b>{m.nom}</b><small>{m.email}</small></span></div></td>
                    <td>{m.ville || '—'}</td>
                    <td><span className={`adm-pastille ${m.role === 'PRESTATAIRE' ? 'bleu' : 'gris'}`}>{m.est_administrateur ? 'Administrateur' : m.role === 'PRESTATAIRE' ? 'Prestataire' : 'Client'}</span></td>
                    <td>{dateCourte(m.inscrit_le)}</td>
                    <td>{ilYa(m.derniere_connexion)}</td>
                    <td><span className={`adm-pastille ${ton}`}>{libelle}</span></td>
                    <td className="act" onClick={(e) => e.stopPropagation()}>
                      {decider && !m.est_administrateur && (m.statut_compte === 'BLOQUE'
                        ? <button type="button" className="adm-mini vert" disabled={action.isPending} onClick={() => action.mutate({ id: m.membre_id, action: 'reactiver' })}>Réactiver</button>
                        : <button type="button" className="adm-mini rouge" onClick={() => { action.reset(); setASuspendre(m) }}>Suspendre</button>)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <Plus requete={liste} />
      <p className="rs-aide" style={{ marginTop: 12 }}>Un membre suspendu ne peut plus se connecter, et ses réservations à venir sont annulées. Clique sur une ligne pour voir sa fiche.</p>

      {ouvert && <FicheMembre id={ouvert} onFermer={() => setOuvert(null)} />}
      {aSuspendre && (
        <FenetreMotif titre="Suspendre le compte" sousTitre={`${aSuspendre.nom} · ${aSuspendre.email}`}
          texte="Le membre ne pourra plus se connecter et ses réservations à venir seront annulées. Tu pourras réactiver le compte à tout moment."
          bouton="Suspendre" mutation={action}
          onValider={(motif) => action.mutate({ id: aSuspendre.membre_id, action: 'suspendre', motif }, { onSuccess: () => setASuspendre(null) })}
          onFermer={() => { setASuspendre(null); action.reset() }} />
      )}
    </main>
  )
}

function FicheMembre({ id, onFermer }) {
  const fiche = useMembreAdmin(id)
  const m = fiche.data
  const s = m?.statistiques ?? {}
  const LIBELLES = {
    demandes_publiees: 'Demandes publiées', reservations_client: 'Réservations faites', reservations_recues: 'Réservations reçues',
    prestations_terminees: 'Prestations terminées', avis_recus: 'Avis reçus', publications: 'Publications',
  }
  return (
    <Modale large titre={m?.nom ?? 'Fiche du membre'} sousTitre={m ? `${m.email} · inscrit le ${dateCourte(m.inscrit_le)}` : ''} onFermer={onFermer}>
      {fiche.isPending && <div className="ep-squelette" style={{ height: 260 }} />}
      {fiche.isError && <p className="rs-erreur">{messageErreur(fiche.error)}</p>}
      {m && (
        <>
          <div className="adm-infos">
            <div><small>Ville</small><b>{[m.localite, m.ville].filter(Boolean).join(', ') || '—'}</b></div>
            <div><small>Téléphone</small><b>{m.telephone || '—'}</b></div>
            <div><small>Connexion</small><b>{m.connexion_via === 'email' ? 'E-mail' : m.connexion_via}</b></div>
            <div><small>Connexions</small><b>{m.nombre_connexion}</b></div>
          </div>
          {m.profil_professionnel && (
            <p className="rs-aide" style={{ fontSize: 14 }}>
              Prestataire : <b style={{ color: 'var(--texte)' }}>{m.profil_professionnel.titre}</b> · {m.profil_professionnel.certification === 'CERTIFIE' ? 'certifié' : 'non certifié'}
              {m.profil_professionnel.note_moyenne > 0 && ` · ${String(m.profil_professionnel.note_moyenne).replace('.', ',')} ★`}
            </p>
          )}
          <div className="adm-stats">
            {Object.entries(s).map(([k, v]) => <div key={k}><b>{v}</b><small>{LIBELLES[k] ?? k.replace(/_/g, ' ')}</small></div>)}
          </div>
          {m.blocage && (
            <p className="rs-motif"><b>Suspendu le {dateCourte(m.blocage.bloque_le)}{m.blocage.bloque_par ? ` par ${m.blocage.bloque_par}` : ''} : </b>{m.blocage.motif}</p>
          )}
          <div className="rs-pied">
            <button type="button" className="rs-btn plein" onClick={onFermer}>Fermer</button>
          </div>
        </>
      )}
    </Modale>
  )
}