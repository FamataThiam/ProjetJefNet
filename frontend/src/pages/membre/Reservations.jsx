import { Link, useSearchParams } from 'react-router-dom'
import { useReservations } from '../../api/reservations'
import Avatar from '../../components/membre/Avatar'
import { STATUTS, fcfa, jourCourt, numeroJour, resteAFaire, titreServices } from '../../components/reservations/format'
import '../../components/reservations/reservations.css'
import useSession from '../../hooks/useSession'

const ONGLETS = ['EN_ATTENTE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE', 'REFUSEE']

// /reservations?vue=faites|recues&statut=…
export default function Reservations() {
  const { user } = useSession()
  const [params, setParams] = useSearchParams()
  const prestataire = Boolean(user?.est_prestataire)
  const vue = prestataire && params.get('vue') === 'recues' ? 'recues' : 'faites'
  const statut = ONGLETS.includes(params.get('statut')) ? params.get('statut') : ''
  const liste = useReservations(vue, statut)

  const changer = (cle, valeur) => {
    const p = new URLSearchParams(params)
    valeur ? p.set(cle, valeur) : p.delete(cle)
    if (cle === 'vue') p.delete('statut')
    setParams(p, { replace: true })
  }

  const pages = liste.data?.pages ?? []
  const reservations = pages.flatMap((p) => p.data)
  const compteurs = pages[0]?.compteurs ?? {}
  const total = Object.values(compteurs).reduce((t, n) => t + n, 0)

  return (
    <main className="rs">
      <div className="rs-taches" aria-hidden="true"><i /><i /></div>
      <div className="rs-entete">
        <div>
          <h1 className="rs-titre">Réservations</h1>
          <p className="rs-sous">{vue === 'recues' ? 'Les réservations que tes clients t’ont envoyées.' : 'Suis chaque réservation de l’envoi jusqu’à l’avis.'}</p>
        </div>
        {prestataire && (
          <div className="rs-bascule">
            <button type="button" className={vue === 'faites' ? 'on' : ''} onClick={() => changer('vue', '')}>Mes réservations</button>
            <button type="button" className={vue === 'recues' ? 'on' : ''} onClick={() => changer('vue', 'recues')}>Reçues</button>
          </div>
        )}
      </div>

      <div className="rs-onglets">
        <button type="button" className={!statut ? 'on' : ''} onClick={() => changer('statut', '')}>Toutes<i>{total}</i></button>
        {ONGLETS.filter((s) => compteurs[s] || s === statut).map((s) => (
          <button key={s} type="button" className={statut === s ? 'on' : ''} onClick={() => changer('statut', s)}>
            {STATUTS[s].onglet}<i>{compteurs[s] ?? 0}</i>
          </button>
        ))}
      </div>

      {liste.isPending && <div className="rs-liste">{[0, 1, 2].map((k) => <div key={k} className="rs-squelette" style={{ height: 110 }} />)}</div>}

      {liste.isError && <div className="verre rs-vide"><b>Chargement impossible</b>Le serveur ne répond pas. Réessaie dans un instant.</div>}

      {liste.isSuccess && reservations.length === 0 && (
        <div className="verre rs-vide">
          <b>{statut ? 'Aucune réservation dans cet onglet' : vue === 'recues' ? 'Aucune réservation reçue' : 'Aucune réservation pour le moment'}</b>
          {vue === 'recues' ? 'Elles apparaîtront ici dès qu’un client te réservera.' : 'Trouve un prestataire depuis le fil ou la carte, puis réserve-le.'}
          {vue === 'faites' && !statut && <div style={{ marginTop: 16 }}><Link to="/carte" className="rs-btn clair">Voir la carte des prestataires</Link></div>}
        </div>
      )}

      <div className="rs-liste">
        {reservations.map((r, k) => <LigneReservation key={r.id} r={r} recue={vue === 'recues'} delai={Math.min(k, 8) * 40} />)}
      </div>

      {liste.hasNextPage && (
        <div className="rs-plus">
          <button type="button" className="rs-btn contour" disabled={liste.isFetchingNextPage} onClick={() => liste.fetchNextPage()}>
            {liste.isFetchingNextPage ? 'Chargement…' : 'Voir plus'}
          </button>
        </div>
      )}
    </main>
  )
}

function LigneReservation({ r, recue, delai }) {
  const autre = recue ? r.client : r.prestataire
  const reste = resteAFaire(r)
  const st = STATUTS[r.statut] ?? { libelle: r.statut, classe: 'ann' }

  return (
    <Link to={`/reservations/${r.id}`} className="verre rs-ligne-resa" style={{ animationDelay: `${delai}ms` }}>
      <div className="rs-date"><small>{jourCourt(r.date_prevue)}</small><b>{numeroJour(r.date_prevue)}</b><span>{r.heure_prevue}</span></div>
      <div style={{ minWidth: 0 }}>
        <h4>{titreServices(r.services)}</h4>
        <p>{r.adresse_intervention} · {r.type === 'DEMANDE' ? 'Depuis une demande' : 'Réservation directe'}</p>
      </div>
      <div className="rs-qui">
        <Avatar nom={autre?.nom ?? ''} photo={autre?.photo_url} couleur={autre?.couleur} px={36} />
        <span>{autre?.nom}<small>{recue ? 'Client' : autre?.titre}</small></span>
      </div>
      <div className="rs-fin">
        <span className={`rs-st ${st.classe}`}>{st.libelle}</span>
        <b>{fcfa(r.prix_final)}</b>
        {reste && <span className={`rs-afaire ${reste.fait ? 'fait' : ''} ${reste.attente ? 'attente' : ''}`}>{reste.texte}</span>}
      </div>
    </Link>
  )
}