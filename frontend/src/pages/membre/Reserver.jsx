import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { erreursChamps, messageErreur } from '../../api/erreurs'
import { useReserver } from '../../api/reservations'
import { usePrestataire } from '../../api/visiteur'
import Avatar from '../../components/membre/Avatar'
import { duree } from '../../components/profil/format'
import { creneauxDe, dateLongue, fcfa, jourCourt, moisCourt, numeroJour } from '../../components/reservations/format'
import '../../components/reservations/reservations.css'
import useSession from '../../hooks/useSession'

const aujourdhui = () => new Date().toISOString().slice(0, 10)


export default function Reserver() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useSession()
  const profil = usePrestataire(id)
  const reserver = useReserver()

  const m = user?.membre
  const [choix, setChoix] = useState(() => new Set(params.get('service') ? [Number(params.get('service'))] : []))
  const [jour, setJour] = useState(null)
  const [heure, setHeure] = useState(null)
  const [adresse, setAdresse] = useState(() => [m?.localite, m?.ville].filter(Boolean).join(', '))


  const jours = useMemo(() => {
    const parJour = {}
    for (const d of profil.data?.disponibilites ?? []) {
      parJour[d.jour] = [...new Set([...(parJour[d.jour] ?? []), ...creneauxDe(d)])].sort()
    }
    return Object.entries(parJour).filter(([, h]) => h.length)
  }, [profil.data])

  if (profil.isPending) return <Page><div className="rs-squelette" style={{ height: 420, marginTop: 22 }} /></Page>
  if (profil.isError) {
    return (
      <Page>
        <div className="verre rs-vide"><b>Prestataire introuvable</b>Ce profil n'existe pas ou n'est plus visible.</div>
      </Page>
    )
  }

  const p = profil.data
  const u = p.prestataire
  const nom = `${u.prenom} ${u.nom}`

  if (user?.id === p.id) {
    return (
      <Page>
        <div className="verre rs-vide"><b>C'est ton propre profil</b>Tu ne peux pas réserver tes propres services.
          <div style={{ marginTop: 16 }}><Link to={`/prestataires/${p.id}`} className="rs-btn clair">Revenir au profil</Link></div>
        </div>
      </Page>
    )
  }

  const services = p.services ?? []
  const choisis = services.filter((s) => choix.has(s.id))
  const total = choisis.reduce((t, s) => t + s.prix, 0)
  const heuresDuJour = jours.find(([j]) => j === jour)?.[1] ?? []
  const sansDispos = jours.length === 0
  const erreurs = erreursChamps(reserver.error)
  const pret = choisis.length > 0 && jour && heure && adresse.trim().length > 3

  const basculer = (sid) => setChoix((c) => { const n = new Set(c); n.has(sid) ? n.delete(sid) : n.add(sid); return n })
  const choisirJour = (j) => { setJour(j); setHeure(null) }

  const envoyer = () => reserver.mutate(
    { prestataire_uuid: p.id, services: [...choix], date_prevue: jour, heure_prevue: heure, adresse_intervention: adresse.trim() },
    { onSuccess: (r) => navigate(`/reservations/${r.id}`, { replace: true }) },
  )

  return (
    <Page>
      <div className="rs-ariane"><Link to={`/prestataires/${p.id}`}>Profil de {nom}</Link><span>›</span><b>Réserver</b></div>
      <h1 className="rs-titre">Réserver {u.prenom}</h1>
      <p className="rs-sous">Choisis tes services, un créneau parmi ses disponibilités, puis l'adresse d'intervention.</p>

      <div className="rs-res">
        <div>
          <section className="verre rs-etape">
            <h3><i>1</i>Services<small>{choisis.length ? `${choisis.length} sélectionné${choisis.length > 1 ? 's' : ''}` : 'Au moins un'}</small></h3>
            {services.length === 0 && <p className="rs-aide">Ce prestataire n'a aucun service actif pour le moment.</p>}
            {services.map((s) => (
              <button key={s.id} type="button" className={`rs-svc ${choix.has(s.id) ? 'on' : ''}`} onClick={() => basculer(s.id)} aria-pressed={choix.has(s.id)}>
                <i className="rs-case" />
                <span><b>{s.nom}</b><small>{[s.unite_tarif, duree(s.duree)].filter(Boolean).join(' · ')}</small></span>
                <em>{fcfa(s.prix)}</em>
              </button>
            ))}
            {erreurs.services && <p className="rs-champ-err">{erreurs.services}</p>}
          </section>

          <section className="verre rs-etape" style={{ animationDelay: '.06s' }}>
            <h3><i>2</i>Créneau<small>{sansDispos ? 'Aucune disponibilité publiée' : `Disponibilités publiées par ${u.prenom}`}</small></h3>
            {sansDispos ? (
              <>
                <p className="rs-aide" style={{ marginTop: 0, marginBottom: 12 }}>{u.prenom} n'a pas encore publié de disponibilités. Propose une date et une heure : il pourra confirmer ou refuser.</p>
                <div className="rs-grille2" style={{ marginTop: 0 }}>
                  <input type="date" className="rs-champ" min={aujourdhui()} value={jour ?? ''} onChange={(e) => setJour(e.target.value || null)} />
                  <input type="time" className="rs-champ" step="1800" value={heure ?? ''} onChange={(e) => setHeure(e.target.value || null)} />
                </div>
              </>
            ) : (
              <>
                <div className="rs-jours">
                  {jours.map(([j]) => (
                    <button key={j} type="button" className={`rs-jour ${jour === j ? 'on' : ''}`} onClick={() => choisirJour(j)}>
                      <small>{jourCourt(j)}</small><b>{numeroJour(j)}</b><span>{moisCourt(j)}</span>
                    </button>
                  ))}
                </div>
                {jour ? (
                  <>
                    <p className="rs-plage">{dateLongue(jour)}</p>
                    <div className="rs-heures">
                      {heuresDuJour.map((h) => (
                        <button key={h} type="button" className={`rs-heure ${heure === h ? 'on' : ''}`} onClick={() => setHeure(h)}>{h}</button>
                      ))}
                    </div>
                  </>
                ) : <p className="rs-plage">Choisis un jour pour voir les heures.</p>}
              </>
            )}
            {(erreurs.date_prevue || erreurs.heure_prevue) && <p className="rs-champ-err">{erreurs.date_prevue || erreurs.heure_prevue}</p>}
          </section>

          <section className="verre rs-etape" style={{ animationDelay: '.12s' }}>
            <h3><i>3</i>Adresse d'intervention</h3>
            <input className="rs-champ" value={adresse} maxLength={255} placeholder="Quartier, rue, numéro de la maison…" onChange={(e) => setAdresse(e.target.value)} />
            <p className="rs-aide">Le prestataire la verra après ta réservation, avec ton numéro de téléphone.</p>
            {erreurs.adresse_intervention && <p className="rs-champ-err">{erreurs.adresse_intervention}</p>}
          </section>
        </div>

        <aside className="verre rs-recap">
          <div className="rs-pres">
            <Avatar nom={nom} photo={u.membre?.photo_url} couleur={u.membre?.couleur_perso} px={52} />
            <div>
              <b>{nom}</b>
              <small>{[p.titre_professionnel, u.membre?.ville].filter(Boolean).join(' · ')}</small>
              {(p.est_certifie || p.note_moyenne) && (
                <span className="rs-badge-c">{[p.est_certifie && 'Certifié', p.note_moyenne && `${String(p.note_moyenne).replace('.', ',')} ★`].filter(Boolean).join(' · ')}</span>
              )}
            </div>
          </div>
          <div style={{ paddingTop: 12 }}>
            {choisis.length === 0 && <p className="rs-aide" style={{ marginTop: 0 }}>Aucun service choisi.</p>}
            {choisis.map((s) => <div key={s.id} className="rs-ligne"><span>{s.nom}</span><b>{fcfa(s.prix)}</b></div>)}
            {jour && heure && <div className="rs-ligne"><span>Date</span><b>{jourCourt(jour)} {numeroJour(jour)} {moisCourt(jour)} à {heure}</b></div>}
          </div>
          <div className="rs-total"><span>Total</span><b>{fcfa(total)}</b></div>
          <p className="rs-note">Rien à payer maintenant. {u.prenom} doit d'abord confirmer. Le paiement se fait à la fin de la prestation (Wave, Orange Money, Free Money, carte ou espèces).</p>
          <button type="button" className="rs-btn plein large" disabled={!pret || reserver.isPending} onClick={envoyer}>
            {reserver.isPending ? 'Envoi…' : 'Envoyer la réservation'}
          </button>
          {reserver.isError && !Object.keys(erreurs).length && <p className="rs-erreur">{messageErreur(reserver.error)}</p>}
        </aside>
      </div>
    </Page>
  )
}

function Page({ children }) {
  return (
    <main className="rs">
      <div className="rs-taches" aria-hidden="true"><i /><i /></div>
      {children}
    </main>
  )
}