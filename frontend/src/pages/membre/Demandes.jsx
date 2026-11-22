import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useAnnulerDemande, useDemandesAPrendre, useMesDemandes } from '../../api/demandes'
import { messageErreur } from '../../api/erreurs'
import FenetreAccepter from '../../components/demandes/FenetreAccepter'
import '../../components/demandes/demandes.css'
import { ilYa, partRestante, texteExpiration } from '../../components/demandes/temps'
import Modale from '../../components/reservations/Modale'
import '../../components/reservations/reservations.css'
import useSession from '../../hooks/useSession'

const STATUTS = {
  EN_ATTENTE: { libelle: 'En attente', onglet: 'En attente', classe: 'att' },
  ACCEPTEE: { libelle: 'Acceptée', onglet: 'Acceptées', classe: 'fini' },
  EXPIREE: { libelle: 'Expirée', onglet: 'Expirées', classe: 'exp' },
  ANNULEE: { libelle: 'Annulée', onglet: 'Annulées', classe: 'ann' },
}
const dateCourte = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })


export default function Demandes() {
  const { user } = useSession()
  const { state } = useLocation()
  const [params, setParams] = useSearchParams()
  const prestataire = Boolean(user?.est_prestataire)
  const vue = prestataire && params.get('vue') === 'a-prendre' ? 'a-prendre' : 'miennes'
  const aPrendre = useDemandesAPrendre(prestataire)
  const nbAPrendre = aPrendre.data?.pages[0]?.meta.total ?? 0

  const changer = (cle, valeur) => {
    const p = new URLSearchParams(params)
    valeur ? p.set(cle, valeur) : p.delete(cle)
    if (cle === 'vue') { p.delete('statut'); p.delete('domaine') }
    setParams(p, { replace: true })
  }

  return (
    <main className="rs">
      <div className="rs-taches" aria-hidden="true"><i /><i /></div>
      <div className="rs-entete">
        <div>
          <h1 className="rs-titre">Demandes</h1>
          <p className="rs-sous">{vue === 'a-prendre' ? 'Les demandes de tes domaines dans ta zone d’intervention, les plus proches d’abord.' : 'Tes demandes publiées et leur avancement.'}</p>
        </div>
        <div className="dm-droite">
          {prestataire && (
            <div className="rs-bascule">
              <button type="button" className={vue === 'miennes' ? 'on' : ''} onClick={() => changer('vue', '')}>Mes demandes</button>
              <button type="button" className={vue === 'a-prendre' ? 'on' : ''} onClick={() => changer('vue', 'a-prendre')}>À prendre{nbAPrendre ? ` · ${nbAPrendre}` : ''}</button>
            </div>
          )}
          {vue === 'miennes' && <Link to="/demandes/nouvelle" className="rs-btn plein">Nouvelle demande</Link>}
        </div>
      </div>

      {state?.publiee && vue === 'miennes' && <p className="rs-ok" style={{ marginTop: 18 }}>Demande publiée. Les prestataires de ta zone peuvent maintenant la voir.</p>}

      {vue === 'a-prendre'
        ? <APrendre requete={aPrendre} domaine={params.get('domaine')} changer={changer} />
        : <MesDemandes statut={STATUTS[params.get('statut')] ? params.get('statut') : ''} changer={changer} />}
    </main>
  )
}


function MesDemandes({ statut, changer }) {
  const liste = useMesDemandes(statut)
  const annuler = useAnnulerDemande()
  const [aAnnuler, setAAnnuler] = useState(null)
  const pages = liste.data?.pages ?? []
  const demandes = pages.flatMap((p) => p.data)
  const compteurs = pages[0]?.compteurs ?? {}
  const total = Object.values(compteurs).reduce((t, n) => t + n, 0)

  return (
    <>
      <div className="rs-onglets">
        <button type="button" className={!statut ? 'on' : ''} onClick={() => changer('statut', '')}>Toutes<i>{total}</i></button>
        {Object.entries(STATUTS).filter(([s]) => compteurs[s] || s === statut).map(([s, v]) => (
          <button key={s} type="button" className={statut === s ? 'on' : ''} onClick={() => changer('statut', s)}>{v.onglet}<i>{compteurs[s] ?? 0}</i></button>
        ))}
      </div>

      <Etat requete={liste} vide={demandes.length === 0}
        texteVide={<><b>{statut ? 'Aucune demande dans cet onglet' : 'Aucune demande pour le moment'}</b>Décris ton besoin : les prestataires de ta zone pourront l’accepter.
          {!statut && <div style={{ marginTop: 16 }}><Link to="/demandes/nouvelle" className="rs-btn clair">Faire une demande</Link></div>}</>} />

      <div className="dm-cartes">
        {demandes.map((d, k) => {
          const st = STATUTS[d.statut] ?? { libelle: d.statut, classe: 'ann' }
          const part = partRestante(d.expire_le)
          return (
            <article key={d.id} className="verre dm-carte-d" style={{ animationDelay: `${Math.min(k, 8) * 40}ms` }}>
              <div className="dm-puces"><span className="dm-puce">{d.domaine?.libelle}</span><span className={`rs-st ${st.classe}`}>{st.libelle}</span></div>
              <h4>{d.titre}</h4>
              <p>{d.description}</p>
              <div className="dm-meta">
                <span>{[d.localite, d.ville].filter(Boolean).join(', ')}</span>
                {d.statut === 'ACCEPTEE' && d.reservation
                  ? <span>Acceptée par <b>{d.reservation.prestataire}</b></span>
                  : <span>Publiée le {dateCourte(d.cree_le)}</span>}
                {d.statut === 'EN_ATTENTE' && <span>Expire <b>{texteExpiration(d.expire_le)}</b></span>}
                {d.statut === 'EXPIREE' && <span>Aucun prestataire en 7 jours</span>}
              </div>
              {d.statut === 'EN_ATTENTE' && <div className={`dm-jauge ${part < 30 ? 'fin' : ''}`}><i style={{ width: `${part}%` }} /></div>}
              <div className="dm-actions">
                {d.statut === 'EN_ATTENTE' && <button type="button" className="rs-btn rouge petit" onClick={() => setAAnnuler(d)}>Annuler la demande</button>}
                {d.statut === 'ACCEPTEE' && d.reservation && <Link to={`/reservations/${d.reservation.id}`} className="rs-btn clair petit">Voir la réservation</Link>}
                {(d.statut === 'EXPIREE' || d.statut === 'ANNULEE') && <Link to={`/demandes/nouvelle?depuis=${d.id}`} className="rs-btn contour petit">Republier</Link>}
              </div>
            </article>
          )
        })}
      </div>
      <Plus requete={liste} />

      {aAnnuler && (
        <Modale titre="Annuler la demande ?" sousTitre={aAnnuler.titre} onFermer={() => { setAAnnuler(null); annuler.reset() }}>
          <p className="rs-aide" style={{ marginTop: 0, fontSize: 14 }}>Elle ne sera plus visible par les prestataires. Tu pourras la republier plus tard.</p>
          {annuler.isError && <p className="rs-erreur">{messageErreur(annuler.error)}</p>}
          <div className="rs-pied">
            <button type="button" className="rs-btn contour" onClick={() => setAAnnuler(null)}>Garder</button>
            <button type="button" className="rs-btn rouge" disabled={annuler.isPending}
              onClick={() => annuler.mutate(aAnnuler.id, { onSuccess: () => setAAnnuler(null) })}>{annuler.isPending ? 'Annulation…' : 'Annuler la demande'}</button>
          </div>
        </Modale>
      )}
    </>
  )
}


function APrendre({ requete, domaine, changer }) {
  const [ouverte, setOuverte] = useState(null)
  const toutes = (requete.data?.pages ?? []).flatMap((p) => p.data)
  const parDomaine = {}
  toutes.forEach((d) => { parDomaine[d.domaine.libelle] = (parDomaine[d.domaine.libelle] ?? 0) + 1 })
  const demandes = domaine ? toutes.filter((d) => d.domaine.libelle === domaine) : toutes

  return (
    <>
      <div className="rs-onglets">
        <button type="button" className={!domaine ? 'on' : ''} onClick={() => changer('domaine', '')}>Toutes<i>{toutes.length}</i></button>
        {Object.keys(parDomaine).length > 1 && Object.entries(parDomaine).map(([libelle, n]) => (
          <button key={libelle} type="button" className={domaine === libelle ? 'on' : ''} onClick={() => changer('domaine', libelle)}>{libelle}<i>{n}</i></button>
        ))}
      </div>

      <Etat requete={requete} vide={demandes.length === 0}
        texteVide={<><b>Aucune demande à prendre</b>Aucun client de ta zone n’a publié de demande dans tes domaines ces 7 derniers jours.</>} />

      <div className="dm-cartes">
        {demandes.map((d, k) => (
          <article key={d.id} className="verre dm-carte-d" style={{ animationDelay: `${Math.min(k, 8) * 40}ms` }}>
            <div className="dm-puces">
              <span className="dm-puce">{d.domaine.libelle}</span>
              {d.distance_km !== null && <span className="dm-dist">{String(d.distance_km).replace('.', ',')}<small>km</small></span>}
            </div>
            <h4>{d.titre}</h4>
            <p>{d.description}</p>
            <div className="dm-meta">
              <span>{[d.localite, d.ville].filter(Boolean).join(', ')}</span>
              <span>{ilYa(d.cree_le)}</span>
              <span>Expire <b>{texteExpiration(d.expire_le)}</b></span>
            </div>
            <div className="dm-actions"><button type="button" className="rs-btn plein petit" onClick={() => setOuverte(d)}>Voir et accepter</button></div>
          </article>
        ))}
      </div>
      <Plus requete={requete} />

      {ouverte && <FenetreAccepter demande={ouverte} onFermer={() => setOuverte(null)} />}
    </>
  )
}

function Etat({ requete, vide, texteVide }) {
  if (requete.isPending) return <div className="dm-cartes">{[0, 1, 2, 3].map((k) => <div key={k} className="rs-squelette" style={{ height: 190 }} />)}</div>
  if (requete.isError) {
    const pasPresta = requete.error?.response?.status === 403
    return <div className="verre rs-vide"><b>{pasPresta ? 'Réservé aux prestataires' : 'Chargement impossible'}</b>{pasPresta ? 'Complète ton profil prestataire pour voir les demandes.' : messageErreur(requete.error)}</div>
  }
  return vide ? <div className="verre rs-vide">{texteVide}</div> : null
}

function Plus({ requete }) {
  if (!requete.hasNextPage) return null
  return (
    <div className="rs-plus">
      <button type="button" className="rs-btn contour" disabled={requete.isFetchingNextPage} onClick={() => requete.fetchNextPage()}>
        {requete.isFetchingNextPage ? 'Chargement…' : 'Voir plus'}
      </button>
    </div>
  )
}