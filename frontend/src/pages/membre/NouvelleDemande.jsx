import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMaDemande, usePublierDemande } from '../../api/demandes'
import { erreursChamps, messageErreur } from '../../api/erreurs'
import { useDomaines } from '../../api/visiteur'
import ChoixLieu from '../../components/demandes/ChoixLieu'
import '../../components/demandes/demandes.css'
import '../../components/reservations/reservations.css'
import useSession from '../../hooks/useSession'


export default function NouvelleDemande() {
  const [params] = useSearchParams()
  const depuis = params.get('depuis')
  const ancienne = useMaDemande(depuis)
  // republier : on attend l'ancienne demande pour préremplir le formulaire
  if (depuis && ancienne.isPending) {
    return <main className="rs"><div className="rs-squelette" style={{ height: 420, marginTop: 60 }} /></main>
  }
  return <Formulaire a={ancienne.data} />
}

function Formulaire({ a }) {
  const { user } = useSession()
  const navigate = useNavigate()
  const domaines = useDomaines()
  const publier = usePublierDemande()
  const m = user?.membre

  const [f, setF] = useState(() => (a
    ? {
        domaine_id: a.domaine?.id ?? null, titre: a.titre, description: a.description, adresse: a.adresse ?? '',
        ville: a.ville ?? '', localite: a.localite ?? '', position: { latitude: a.latitude, longitude: a.longitude, source: 'carte' },
      }
    : { domaine_id: null, titre: '', description: '', adresse: '', ville: m?.ville ?? '', localite: m?.localite ?? '', position: null }))
  const changer = (champs) => setF((x) => ({ ...x, ...champs }))

  const erreurs = erreursChamps(publier.error)
  const domaine = domaines.data?.find((d) => d.id === f.domaine_id)
  const pret = f.domaine_id && f.titre.trim().length >= 5 && f.description.trim().length >= 20 && f.adresse.trim() && f.ville.trim() && f.position

  const envoyer = () => publier.mutate({
    domaine_id: f.domaine_id,
    titre: f.titre.trim(),
    description: f.description.trim(),
    adresse: f.adresse.trim(),
    ville: f.ville.trim(),
    localite: f.localite.trim() || null,
    latitude: f.position.latitude,
    longitude: f.position.longitude,
  }, { onSuccess: () => navigate('/demandes', { replace: true, state: { publiee: true } }) })

  const lieu = [f.localite, f.ville].map((t) => t.trim()).filter(Boolean).join(', ')

  return (
    <main className="rs">
      <div className="rs-taches" aria-hidden="true"><i /><i /></div>
      <div className="rs-ariane"><Link to="/demandes">Demandes</Link><span>›</span><b>{a ? 'Republier' : 'Nouvelle demande'}</b></div>
      <h1 className="rs-titre">{a ? 'Republier une demande' : 'Faire une demande'}</h1>
      <p className="rs-sous">Décris ton besoin : les prestataires du domaine autour de toi la verront et pourront l’accepter.</p>

      <div className="rs-res">
        <div>
          <section className="verre rs-etape">
            <h3><i>1</i>Domaine</h3>
            {domaines.isPending && <div className="rs-squelette" style={{ height: 90 }} />}
            <div className="dm-domaines">
              {domaines.data?.map((d) => (
                <button key={d.id} type="button" className={`dm-dom ${f.domaine_id === d.id ? 'on' : ''}`} onClick={() => changer({ domaine_id: d.id })}>{d.libelle}</button>
              ))}
            </div>
            {erreurs.domaine_id && <p className="rs-champ-err">{erreurs.domaine_id}</p>}
          </section>

          <section className="verre rs-etape" style={{ animationDelay: '.06s' }}>
            <h3><i>2</i>Ton besoin</h3>
            <label className="dm-lbl haut" htmlFor="titre">Titre</label>
            <input id="titre" className="rs-champ" maxLength={150} value={f.titre} placeholder="Ex. : Prises qui ne marchent plus dans le salon" onChange={(e) => changer({ titre: e.target.value })} />
            {erreurs.titre && <p className="rs-champ-err">{erreurs.titre}</p>}
            <label htmlFor="desc" className="dm-lbl">Description</label>
            <textarea id="desc" className="rs-champ" rows={5} maxLength={2000} value={f.description} onChange={(e) => changer({ description: e.target.value })}
              placeholder="Ce qui se passe, depuis quand, ce que tu attends, tes disponibilités…" />
            <p className="rs-aide dm-compte">
              <span>{f.description.trim().length < 20 ? `Au moins 20 caractères (${f.description.trim().length}/20).` : 'Plus c’est précis, plus les prestataires peuvent te répondre vite.'}</span>
              <span>{f.description.length} / 2000</span>
            </p>
            {erreurs.description && <p className="rs-champ-err">{erreurs.description}</p>}
          </section>

          <section className="verre rs-etape" style={{ animationDelay: '.12s' }}>
            <h3><i>3</i>Lieu d’intervention</h3>
            <div className="dm-grille">
              <div>
                <label htmlFor="ville" className="dm-lbl haut">Ville</label>
                <input id="ville" className="rs-champ" maxLength={100} value={f.ville} onChange={(e) => changer({ ville: e.target.value })} />
                {erreurs.ville && <p className="rs-champ-err">{erreurs.ville}</p>}
              </div>
              <div>
                <label htmlFor="localite" className="dm-lbl haut">Localité (facultatif)</label>
                <input id="localite" className="rs-champ" maxLength={100} value={f.localite} placeholder="Quartier" onChange={(e) => changer({ localite: e.target.value })} />
              </div>
            </div>
            <label htmlFor="adresse" className="dm-lbl">Adresse</label>
            <input id="adresse" className="rs-champ" maxLength={255} value={f.adresse} placeholder="Rue, numéro de la maison, repère…" onChange={(e) => changer({ adresse: e.target.value })} />
            {erreurs.adresse && <p className="rs-champ-err">{erreurs.adresse}</p>}
            <ChoixLieu position={f.position} ville={f.ville} onChange={(position) => changer({ position })} erreur={erreurs.latitude || erreurs.longitude} />
          </section>
        </div>

        <aside className="verre rs-recap">
          <span className="dm-eti">Ce que verront les prestataires</span>
          <div className="dm-fiche">
            <div className="dm-puces">
              <span className="dm-puce">{domaine?.libelle ?? 'Domaine'}</span>
              {lieu && <span className="dm-puce gris">{lieu}</span>}
            </div>
            <h4 className={f.titre.trim() ? '' : 'vide'}>{f.titre.trim() || 'Le titre de ta demande'}</h4>
            <p className={f.description.trim() ? '' : 'vide'}>
              {f.description.trim() ? (f.description.length > 140 ? `${f.description.trim().slice(0, 140)}…` : f.description.trim()) : 'Ta description apparaîtra ici.'}
            </p>
          </div>
          <div className="dm-etapes">
            <div><i>1</i><span><b>Les prestataires {domaine ? `en ${domaine.libelle.toLowerCase()}` : 'du domaine'}</b> de ta zone voient ta demande.</span></div>
            <div><i>2</i><span>Le premier qui l’accepte propose <b>une date et un prix</b>.</span></div>
            <div><i>3</i><span>Elle devient une <b>réservation confirmée</b>, suivie comme les autres.</span></div>
          </div>
          <p className="rs-note" style={{ marginTop: 0 }}>Ton adresse exacte et ton numéro ne sont montrés qu’au prestataire qui accepte. Sans réponse, la demande expire au bout de 7 jours.</p>
          <button type="button" className="rs-btn plein large" disabled={!pret || publier.isPending} onClick={envoyer}>
            {publier.isPending ? 'Publication…' : 'Publier la demande'}
          </button>
          {!pret && <p className="rs-aide" style={{ textAlign: 'center' }}>Choisis un domaine, écris un titre et une description, puis place le point sur la carte.</p>}
          {publier.isError && !Object.keys(erreurs).length && <p className="rs-erreur">{messageErreur(publier.error)}</p>}
        </aside>
      </div>
    </main>
  )
}