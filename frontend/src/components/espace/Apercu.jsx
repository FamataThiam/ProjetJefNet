import { Link } from 'react-router-dom'
import Avatar from '../membre/Avatar'

const STATUTS = {
  EN_ATTENTE: { libelle: 'En attente', classe: 'attente' },
  CONFIRMEE: { libelle: 'Confirmée', classe: 'ok' },
  EN_COURS: { libelle: 'En cours', classe: 'cours' },
  TERMINEE: { libelle: 'Terminée', classe: 'fini' },
  ANNULEE: { libelle: 'Annulée', classe: 'ko' },
  REFUSEE: { libelle: 'Refusée', classe: 'ko' },
}
const ETAPES = ['EN_ATTENTE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE']
const ACTIVES = ['EN_ATTENTE', 'CONFIRMEE', 'EN_COURS']

const fcfa = (n) => `${Math.round(n ?? 0).toLocaleString('fr-FR')} FCFA`
const jour = (d) => (d ? new Date(`${d}T00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : '')
const servicesDe = (r) => r.services?.map((s) => s.nom).filter(Boolean).join(', ') || 'Prestation'

// La prochaine réservation : une réservation en cours, sinon la plus proche à venir
function prochaineDe(reservations) {
  const enCours = reservations.find((r) => r.statut === 'EN_COURS')
  if (enCours) return enCours
  const aujourdhui = new Date().toISOString().slice(0, 10)
  return reservations
    .filter((r) => ACTIVES.includes(r.statut) && r.date_prevue >= aujourdhui)
    .sort((a, b) => `${a.date_prevue}${a.heure_prevue}`.localeCompare(`${b.date_prevue}${b.heure_prevue}`))[0]
}

// Les prestataires avec qui le client a déjà réservé (sans doublon)
function prestatairesDe(reservations) {
  const vus = new Map()
  reservations.forEach((r) => {
    const p = r.prestataire
    if (!p) return
    const cle = p.uuid ?? p.id
    const deja = vus.get(cle)
    vus.set(cle, { ...p, fois: (deja?.fois ?? 0) + 1 })
  })
  return [...vus.values()].slice(0, 4)
}

function Chiffre({ valeur, libelle, chargement }) {
  return (
    <div className="chiffre verre">
      <b>{chargement ? <span className="sq sq-chiffre" /> : valeur}</b>
      <span>{libelle}</span>
    </div>
  )
}

export default function Apercu({ resume, user, allerA }) {
  const { data, isPending, isError } = resume
  const reservations = data?.reservations ?? []
  const prochaine = prochaineDe(reservations)
  const prestataires = prestatairesDe(reservations)
  const etape = prochaine ? ETAPES.indexOf(prochaine.statut) : -1

  return (
    <>
      <div className="chiffres">
        <Chiffre valeur={data?.total} libelle="Réservations" chargement={isPending} />
        <Chiffre valeur={data?.aVenir} libelle="À venir" chargement={isPending} />
        <Chiffre valeur={data?.terminees} libelle="Terminées" chargement={isPending} />
        <Chiffre valeur={data?.demandes} libelle="Demandes en attente" chargement={isPending} />
      </div>

      <div className="colonne">
        <section className="verre carte-espace">
          <div className="titre-carte"><h2>Prochaine réservation</h2></div>
          {isPending ? <div className="sq sq-bloc" />
            : !prochaine ? (
              <div className="vide-espace">
                <p>Aucune réservation à venir.</p>
                <Link to="/recherche" className="lien-perso">Trouver un prestataire</Link>
              </div>
            ) : (
              <div className="prochaine">
                <div className="prochaine-haut">
                  <div className="date-bloc">
                    <b>{new Date(`${prochaine.date_prevue}T00:00`).getDate()}</b>
                    <small>{new Date(`${prochaine.date_prevue}T00:00`).toLocaleDateString('fr-FR', { month: 'short' })}</small>
                  </div>
                  <div className="prochaine-info">
                    <b>{servicesDe(prochaine)}</b>
                    <span>{prochaine.prestataire?.nom} · {prochaine.prestataire?.titre}</span>
                    <small>{jour(prochaine.date_prevue)} à {prochaine.heure_prevue} · {prochaine.adresse_intervention}</small>
                  </div>
                  <strong className="prix">{fcfa(prochaine.prix_final)}</strong>
                </div>
                <ol className="etapes">
                  {ETAPES.map((s, i) => (
                    <li key={s} className={i < etape ? 'fait' : i === etape ? 'actuel' : ''}>
                      <i />{STATUTS[s].libelle}
                    </li>
                  ))}
                </ol>
              </div>
            )}
        </section>

        <section className="verre carte-espace">
          <div className="titre-carte">
            <h2>Mes dernières réservations</h2>
            <Link to="/reservations" className="lien-perso">Tout voir</Link>
          </div>
          {isPending ? [0, 1, 2].map((i) => <div key={i} className="sq sq-ligne" />)
            : isError ? <p className="vide-espace">Impossible de charger tes réservations.</p>
              : reservations.length === 0 ? <p className="vide-espace">Tu n'as encore fait aucune réservation.</p>
                : (
                  <ul className="liste-resa">
                    {reservations.slice(0, 5).map((r) => (
                      <li key={r.id}>
                        <Avatar nom={r.prestataire?.nom} taille="a40" />
                        <div>
                          <b>{servicesDe(r)}</b>
                          <small>{r.prestataire?.nom} · {jour(r.date_prevue)}</small>
                        </div>
                        <span className={`puce-statut ${STATUTS[r.statut]?.classe ?? ''}`}>{STATUTS[r.statut]?.libelle ?? r.statut}</span>
                      </li>
                    ))}
                  </ul>
                )}
        </section>
      </div>

      <div className="colonne">
        <section className="verre carte-espace">
          <div className="titre-carte"><h2>Mes prestataires</h2></div>
          {isPending ? [0, 1].map((i) => <div key={i} className="sq sq-ligne" />)
            : prestataires.length === 0 ? <p className="vide-espace">Les prestataires avec qui tu réserves apparaîtront ici.</p>
              : (
                <ul className="liste-presta">
                  {prestataires.map((p) => {
                    const contenu = (
                      <>
                        <Avatar nom={p.nom} taille="a40" />
                        <div><b>{p.nom}</b><small>{p.titre}</small></div>
                        <span className="fois">{p.fois} fois</span>
                      </>
                    )
                    return <li key={p.uuid ?? p.id}>{p.uuid ? <Link to={`/prestataires/${p.uuid}`}>{contenu}</Link> : <div>{contenu}</div>}</li>
                  })}
                </ul>
              )}
        </section>

        <section className="verre carte-espace raccourci-compte">
          <h2>Mon compte</h2>
          <p>Modifie tes informations, ta photo, ta signature et la couleur de ton espace.</p>
          <button type="button" className="lien-perso" onClick={() => allerA('compte')}>Ouvrir mon compte</button>
        </section>

        {user?.est_prestataire ? (
          <section className="devenir">
            <span className="anneau-devenir" />
            <h2>Ton activité de prestataire</h2>
            <p>Retrouve tes demandes reçues, tes réservations, tes services et tes statistiques dans ton tableau de bord prestataire.</p>
            <Link to="/espace-prestataire" className="btn-devenir">Ouvrir mon tableau de bord prestataire</Link>
          </section>
        ) : (
          <section className="devenir">
            <span className="anneau-devenir" />
            <h2>Tu as un savoir-faire ?</h2>
            <p>Deviens prestataire sur JefNet : publie tes services et reçois les demandes des clients près de chez toi.</p>
            <Link to="/devenir-prestataire" className="btn-devenir">Devenir prestataire</Link>
          </section>
        )}
      </div>
    </>
  )
}