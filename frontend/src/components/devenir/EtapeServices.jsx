import { DUREES, UNITES, serviceVide } from './donnees'

export default function EtapeServices({ services, setServices, domaines, erreurs }) {
  const changer = (i, champs) => setServices((l) => l.map((s, j) => (j === i ? { ...s, ...champs } : s)))
  const retirer = (i) => setServices((l) => l.filter((_, j) => j !== i))
  const ajouter = () => setServices((l) => [...l, serviceVide(l[l.length - 1]?.domaine_id ?? '')])

  return (
    <div className="vue-dp">
      <h2>Mes services</h2>
      <p className="sous">Ajoute au moins un service avec son prix. Tu pourras en ajouter d'autres depuis ton espace prestataire.</p>

      {services.map((s, i) => {
        const e = erreurs[i] ?? {}
        const id = (nom) => `s${i}-${nom}`
        return (
          <div key={i} className="service-dp">
            <div className="entete-service">
              <b>Service {i + 1}</b>
              {services.length > 1 && <button type="button" onClick={() => retirer(i)}>Retirer</button>}
            </div>

            <div className="deux-dp">
              <div className={`champ-dp ${e.domaine_id ? 'erreur' : ''}`}>
                <label htmlFor={id('domaine')}>Domaine</label>
                <select id={id('domaine')} value={s.domaine_id} onChange={(ev) => changer(i, { domaine_id: ev.target.value ? Number(ev.target.value) : '' })}>
                  <option value="">Choisir…</option>
                  {domaines.map((d) => <option key={d.id} value={d.id}>{d.libelle}</option>)}
                </select>
                {e.domaine_id && <small className="msg-erreur">{e.domaine_id}</small>}
              </div>
              <div className={`champ-dp ${e.nom ? 'erreur' : ''}`}>
                <label htmlFor={id('nom')}>Nom du service</label>
                <input id={id('nom')} value={s.nom} maxLength={150} placeholder="Installation de prise" onChange={(ev) => changer(i, { nom: ev.target.value })} />
                {e.nom && <small className="msg-erreur">{e.nom}</small>}
              </div>
            </div>

            <div className="trois-dp">
              <div className={`champ-dp ${e.prix ? 'erreur' : ''}`}>
                <label htmlFor={id('prix')}>Prix (FCFA)</label>
                <input id={id('prix')} inputMode="numeric" value={s.prix} placeholder="5000"
                  onChange={(ev) => changer(i, { prix: ev.target.value.replace(/\D/g, '').slice(0, 8) })} />
                {e.prix && <small className="msg-erreur">{e.prix}</small>}
              </div>
              <div className={`champ-dp ${e.unite_tarif ? 'erreur' : ''}`}>
                <label htmlFor={id('unite')}>Par</label>
                <select id={id('unite')} value={s.unite_tarif} onChange={(ev) => changer(i, { unite_tarif: ev.target.value })}>
                  {Object.entries(UNITES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className={`champ-dp ${e.duree ? 'erreur' : ''}`}>
                <label htmlFor={id('duree')}>Durée</label>
                <select id={id('duree')} value={s.duree} onChange={(ev) => changer(i, { duree: Number(ev.target.value) })}>
                  {DUREES.map((d) => <option key={d.valeur} value={d.valeur}>{d.libelle}</option>)}
                </select>
              </div>
            </div>

            <div className={`champ-dp sans-marge ${e.description ? 'erreur' : ''}`}>
              <label htmlFor={id('description')}>Description <em>(facultatif)</em></label>
              <input id={id('description')} value={s.description} maxLength={2000} placeholder="Ce qui est compris dans le prix"
                onChange={(ev) => changer(i, { description: ev.target.value })} />
              {e.description && <small className="msg-erreur">{e.description}</small>}
            </div>
          </div>
        )
      })}

      <button type="button" className="ajouter-dp" onClick={ajouter}>Ajouter un service</button>
    </div>
  )
}