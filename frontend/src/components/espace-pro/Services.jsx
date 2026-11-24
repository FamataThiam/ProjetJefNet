import { useState } from 'react'
import { UNITES, useDesactiverService, useEnregistrerService, useMesServicesPro } from '../../api/espacePro'
import { erreursChamps, messageErreur } from '../../api/erreurs'
import { useDomaines } from '../../api/visiteur'
import { duree as dureeLisible } from '../profil/format'
import Modale from '../reservations/Modale'
import { fcfa } from '../reservations/format'

const uniteDe = (u) => UNITES.find((x) => x.valeur === u)?.libelle ?? u
const DUREES = [[15, '15 min'], [30, '30 min'], [45, '45 min'], [60, '1 h'], [90, '1 h 30'], [120, '2 h'], [180, '3 h'], [240, '4 h'], [480, '1 journée'], [960, '2 jours'], [2400, '1 semaine']]


export default function Services() {
  const services = useMesServicesPro()
  const desactiver = useDesactiverService()
  const reactiver = useEnregistrerService()
  const [fenetre, setFenetre] = useState(null)      // { service } ou { nouveau: true }
  const [aDesactiver, setADesactiver] = useState(null)

  const liste = [...(services.data ?? [])].sort((a, b) => Number(b.est_actif) - Number(a.est_actif))
  const actifs = liste.filter((s) => s.est_actif).length
  const erreur = reactiver.error

  return (
    <>
      <div className="ep-outils">
        <h2>Mes services</h2>
        <span>{services.isSuccess ? `${actifs} actif${actifs > 1 ? 's' : ''}${liste.length - actifs ? `, ${liste.length - actifs} désactivé${liste.length - actifs > 1 ? 's' : ''}` : ''}` : ''}</span>
        <button type="button" className="rs-btn plein" onClick={() => setFenetre({ nouveau: true })}>Ajouter un service</button>
      </div>
      {erreur && <p className="rs-erreur" style={{ marginBottom: 12 }}>{messageErreur(erreur)}</p>}

      {services.isPending && <div className="ep-svcs">{[0, 1, 2].map((k) => <div key={k} className="ep-squelette" style={{ height: 240 }} />)}</div>}
      {services.isError && <div className="verre ep-bientot"><b>Chargement impossible</b>{messageErreur(services.error)}</div>}

      {services.isSuccess && (
        <div className="ep-svcs">
          {liste.map((s, k) => (
            <article key={s.id} className={`verre ep-svc ${s.est_actif ? '' : 'off'}`} style={{ animationDelay: `${Math.min(k, 8) * 40}ms` }}>
              <div className="haut">
                <span className="dm-puce ep-puce">{s.domaine?.libelle}</span>
                <span className={`ep-etat ${s.est_actif ? 'on' : ''}`}>{s.est_actif ? 'Actif' : 'Désactivé'}</span>
              </div>
              <h4>{s.nom}</h4>
              <p>{s.description || 'Pas de description.'}</p>
              <div className="prix">{fcfa(s.prix)}<small>{uniteDe(s.unite_tarif).toLowerCase()} · {dureeLisible(s.duree)}</small></div>
              <div className="acts">
                {s.est_actif ? (
                  <>
                    <button type="button" className="rs-btn clair petit" onClick={() => setFenetre({ service: s })}>Modifier</button>
                    <button type="button" className="rs-btn contour petit" onClick={() => setADesactiver(s)}>Désactiver</button>
                  </>
                ) : (
                  <button type="button" className="rs-btn plein petit" disabled={reactiver.isPending && reactiver.variables?.id === s.id}
                    onClick={() => reactiver.mutate({ id: s.id, est_actif: true })}>
                    {reactiver.isPending && reactiver.variables?.id === s.id ? 'Réactivation…' : 'Réactiver'}
                  </button>
                )}
              </div>
            </article>
          ))}
          <button type="button" className="ep-svc-ajout" onClick={() => setFenetre({ nouveau: true })}>
            <b>+</b>Ajouter un service<small>nom, domaine, prix, durée</small>
          </button>
        </div>
      )}
      <p className="rs-aide" style={{ marginTop: 14 }}>Un service désactivé n’apparaît plus sur ton profil et ne peut plus être réservé. Ses anciennes réservations sont conservées.</p>

      {fenetre && <FenetreService service={fenetre.service} onFermer={() => setFenetre(null)} />}

      {aDesactiver && (
        <Modale titre="Désactiver ce service ?" sousTitre={aDesactiver.nom} onFermer={() => { setADesactiver(null); desactiver.reset() }}>
          <p className="rs-aide" style={{ marginTop: 0, fontSize: 14 }}>Il ne sera plus visible ni réservable. Les réservations déjà faites ne changent pas, et tu pourras le réactiver à tout moment.</p>
          {desactiver.isError && <p className="rs-erreur">{messageErreur(desactiver.error)}</p>}
          <div className="rs-pied">
            <button type="button" className="rs-btn contour" onClick={() => setADesactiver(null)}>Garder actif</button>
            <button type="button" className="rs-btn rouge" disabled={desactiver.isPending} onClick={() => desactiver.mutate(aDesactiver.id, { onSuccess: () => setADesactiver(null) })}>
              {desactiver.isPending ? 'Un instant…' : 'Désactiver'}
            </button>
          </div>
        </Modale>
      )}
    </>
  )
}


function FenetreService({ service, onFermer }) {
  const domaines = useDomaines()
  const enregistrer = useEnregistrerService()
  const [f, setF] = useState(() => ({
    nom: service?.nom ?? '', description: service?.description ?? '', domaine_id: service?.domaine?.id ?? '',
    prix: service ? String(Math.round(service.prix)) : '', unite_tarif: service?.unite_tarif ?? 'forfait', duree: service?.duree ?? 60,
  }))
  const changer = (c) => setF((x) => ({ ...x, ...c }))
  const erreurs = erreursChamps(enregistrer.error)
  const pret = f.nom.trim() && f.domaine_id && f.prix !== '' && Number(f.duree) >= 15

  const envoyer = () => enregistrer.mutate({
    id: service?.id, nom: f.nom.trim(), description: f.description.trim() || null, domaine_id: Number(f.domaine_id),
    prix: Number(f.prix), unite_tarif: f.unite_tarif, duree: Number(f.duree),
  }, { onSuccess: onFermer })

  const champ = (cle) => erreurs[cle] && <p className="rs-champ-err">{erreurs[cle]}</p>

  return (
    <Modale titre={service ? 'Modifier le service' : 'Ajouter un service'} sousTitre={service ? 'Les prochaines réservations utiliseront ces informations.' : 'Il apparaîtra tout de suite sur ton profil.'} onFermer={onFermer}>
      <label className="ep-lbl haut" htmlFor="svc-nom">Nom du service</label>
      <input id="svc-nom" className="rs-champ" maxLength={150} value={f.nom} placeholder="Ex. : Réparation de fuite" onChange={(e) => changer({ nom: e.target.value })} />
      {champ('nom')}

      <label className="ep-lbl" htmlFor="svc-dom">Domaine</label>
      <select id="svc-dom" className="rs-champ dm-select" value={f.domaine_id} onChange={(e) => changer({ domaine_id: e.target.value })}>
        <option value="">Choisir un domaine</option>
        {domaines.data?.map((d) => <option key={d.id} value={d.id}>{d.libelle}</option>)}
      </select>
      {champ('domaine_id')}

      <label className="ep-lbl" htmlFor="svc-desc">Description (facultative)</label>
      <textarea id="svc-desc" className="rs-champ" rows={3} maxLength={2000} value={f.description} placeholder="Ce qui est compris dans le prix…" onChange={(e) => changer({ description: e.target.value })} />

      <div className="ep-trio">
        <div>
          <label className="ep-lbl" htmlFor="svc-prix">Prix</label>
          <div className="dm-prix">
            <input id="svc-prix" className="rs-champ" inputMode="numeric" value={f.prix} placeholder="25000" onChange={(e) => changer({ prix: e.target.value.replace(/\D/g, '').slice(0, 8) })} />
            <span>F CFA</span>
          </div>
          {champ('prix')}
        </div>
        <div>
          <label className="ep-lbl" htmlFor="svc-unite">Tarif</label>
          <select id="svc-unite" className="rs-champ dm-select" value={f.unite_tarif} onChange={(e) => changer({ unite_tarif: e.target.value })}>
            {UNITES.map((u) => <option key={u.valeur} value={u.valeur}>{u.libelle}</option>)}
          </select>
        </div>
        <div>
          <label className="ep-lbl" htmlFor="svc-duree">Durée</label>
          <select id="svc-duree" className="rs-champ dm-select" value={f.duree} onChange={(e) => changer({ duree: Number(e.target.value) })}>
            {!DUREES.some(([v]) => v === Number(f.duree)) && <option value={f.duree}>{dureeLisible(f.duree)}</option>}
            {DUREES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {champ('duree')}
        </div>
      </div>

      {enregistrer.isError && !Object.keys(erreurs).length && <p className="rs-erreur">{messageErreur(enregistrer.error)}</p>}
      <div className="rs-pied">
        <button type="button" className="rs-btn contour" onClick={onFermer}>Annuler</button>
        <button type="button" className="rs-btn plein" disabled={!pret || enregistrer.isPending} onClick={envoyer}>
          {enregistrer.isPending ? 'Enregistrement…' : service ? 'Enregistrer' : 'Ajouter le service'}
        </button>
      </div>
    </Modale>
  )
}