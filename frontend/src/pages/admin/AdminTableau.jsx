import { Link } from 'react-router-dom'
import { useTableauAdmin } from '../../api/admin'
import { EnTete } from '../../components/admin/communs'
import { Evolution, MiniCourbe } from '../../components/espace-pro/Graphiques'
import { fcfa } from '../../components/reservations/format'

const nombre = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(n).replace(/[\u202f\u00a0]/g, ' ')
const montantCourt = (n) => (n >= 1e6 ? `${nombre(n / 1e6)} M` : nombre(n))

// /admin : tableau de bord de la plateforme
export default function AdminTableau() {
  const resume = useTableauAdmin('resume')
  const evolution = useTableauAdmin('evolution', { mois: 12 })
  const repart = useTableauAdmin('repartitions')
  const marche = useTableauAdmin('marche')
  const aTraiter = useTableauAdmin('a-traiter')

  const periode = resume.data?.periode
  // la courbe réutilise le graphique de l'espace prestataire : volume en ligne, nouveaux membres en barres
  const mois = (evolution.data?.mois ?? []).map((m) => ({ ...m, chiffre_affaires: m.volume_affaires, prestations: m.nouveaux_membres }))

  return (
    <main className="adm-contenu">
      <EnTete titre="Tableau de bord" sous={periode ? `${periode.libelle} · comparé à la même période du mois dernier (${periode.comparaison.libelle})` : ' '} />

      {resume.isError && <p className="rs-erreur">Le tableau de bord n’a pas pu être calculé. Réessaie dans un instant.</p>}
      <div className="ep-kpis">
        {resume.isPending
          ? Array.from({ length: 8 }, (_, k) => <div key={k} className="ep-squelette" style={{ height: 118 }} />)
          : resume.data?.cartes.map((c, k) => <Carte key={c.cle} c={c} delai={k * 40} />)}
      </div>

      <div className="adm-g2">
        <section className="adm-carte ep-panneau">
          <h3>Croissance sur 12 mois<small>Volume d’affaires et nouveaux membres</small></h3>
          <div className="ep-legende"><span><i className="ca" />Volume d’affaires</span><span><i className="pr" />Nouveaux membres</span></div>
          {evolution.isPending ? <div className="ep-squelette" style={{ height: 200 }} /> : <Evolution mois={mois} />}
        </section>
        <ATraiter d={aTraiter.data} charge={aTraiter.isPending} />
      </div>

      <div className="adm-g3">
        <section className="adm-carte ep-panneau">
          <h3>Domaines les plus demandés</h3>
          <Barres lignes={(repart.data?.domaines ?? []).slice(0, 6).map((d) => [d.libelle, d.reservations, `${d.reservations} rés.`])} vide="Aucune réservation pour le moment." />
        </section>
        <section className="adm-carte ep-panneau">
          <h3>Demandes de service</h3>
          <Barres lignes={(marche.data?.entonnoir_demandes ?? []).map((e) => [e.libelle.replace(' par un prestataire', '').replace(' (prestation terminée)', ''), e.valeur, e.valeur])} vide="Aucune demande publiée." />
          {marche.data?.besoins_non_couverts?.length > 0 && (
            <div className="adm-besoins">
              <b>Besoins non couverts</b>
              {marche.data.besoins_non_couverts.slice(0, 3).map((x) => <span key={`${x.domaine}${x.ville}`}>{x.domaine} à {x.ville} : {x.nombre} demande{x.nombre > 1 ? 's' : ''} sans prestataire</span>)}
            </div>
          )}
        </section>
        <section className="adm-carte ep-panneau">
          <h3>Meilleurs prestataires<small>volume d’affaires</small></h3>
          {!repart.data?.meilleurs_prestataires?.length && <p className="ep-vide">Aucune prestation payée pour le moment.</p>}
          {repart.data?.meilleurs_prestataires?.slice(0, 5).map((p) => (
            <div key={p.id} className="adm-rang">
              <span className="r">{p.rang}</span>
              <span className="n"><b>{p.nom}</b><small>{[p.titre, p.note ? `${String(p.note).replace('.', ',')} ★` : null].filter(Boolean).join(' · ')}</small></span>
              <b className="m">{fcfa(p.montant)}</b>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}

function Carte({ c, delai }) {
  const vide = c.valeur === null || c.valeur === undefined
  let ligne = c.complement
  if (!ligne && c.variation !== null && c.variation !== undefined) {
    const s = c.variation > 0 ? '+' : c.variation < 0 ? '−' : ''
    ligne = c.unite === '%' && c.precedent !== null
      ? `${s}${nombre(Math.abs(c.valeur - c.precedent))} points vs mois dernier`
      : `${s}${nombre(Math.abs(c.variation))} % vs mois dernier`
  }
  return (
    <div className={`adm-carte ep-kpi ${c.alerte ? 'adm-alerte' : ''}`} style={{ animationDelay: `${delai}ms` }}>
      <small>{c.libelle}</small>
      <b>{vide ? '—' : c.unite === 'FCFA' ? montantCourt(c.valeur) : nombre(c.valeur)}{!vide && c.unite && <em>{c.unite}</em>}</b>
      <span className={`ep-var ${c.favorable === true ? 'ok' : c.favorable === false ? 'ko' : ''}`}>{ligne || (c.alerte ? 'à vérifier' : c.precedent === null ? '\u00a0' : 'Stable')}</span>
      <MiniCourbe serie={c.serie} />
    </div>
  )
}

function Barres({ lignes, vide }) {
  if (!lignes.length || lignes.every(([, v]) => !v)) return <p className="ep-vide">{vide}</p>
  const max = Math.max(...lignes.map(([, v]) => v), 1)
  return (
    <div className="adm-barres">
      {lignes.map(([l, v, t]) => (
        <div key={l} className="br"><span>{l}</span><span className="b"><i style={{ width: `${Math.max((v / max) * 100, 2)}%` }} /></span><em>{t}</em></div>
      ))}
    </div>
  )
}

function ATraiter({ d, charge }) {
  const lignes = d ? [
    d.certifications_en_attente?.length > 0 && { n: d.certifications_en_attente.length, titre: 'Certifications en attente', detail: `La plus ancienne : ${d.certifications_en_attente.at(-1)?.il_y_a ?? ''}`, to: '/admin/certifications', action: 'Vérifier' },
    d.especes_en_retard?.length > 0 && { n: d.especes_en_retard.length, titre: 'Espèces non confirmées', detail: `${d.especes_en_retard[0].prestataire} · ${fcfa(d.especes_en_retard[0].montant)}`, to: '/admin/membres', action: 'Voir' },
    d.annulations_recentes?.length > 0 && { n: d.annulations_recentes.length, titre: 'Annulations récentes', detail: d.annulations_recentes[0].motif ? `« ${d.annulations_recentes[0].motif} »` : `${d.annulations_recentes[0].client} · ${d.annulations_recentes[0].prestataire}`, to: '/admin/membres', action: 'Voir' },
    d.derniers_inscrits?.length > 0 && { n: d.derniers_inscrits.length, bleu: true, titre: 'Derniers inscrits', detail: `Dernier : ${d.derniers_inscrits[0].nom}${d.derniers_inscrits[0].ville ? `, ${d.derniers_inscrits[0].ville}` : ''}`, to: '/admin/membres', action: 'Membres' },
  ].filter(Boolean) : []

  return (
    <section className="adm-carte ep-panneau">
      <h3>À traiter</h3>
      {charge && <div className="ep-squelette" style={{ height: 200, marginTop: 12 }} />}
      {!charge && lignes.length === 0 && <p className="ep-vide">Rien en attente.</p>}
      {lignes.map((l) => (
        <Link key={l.titre} to={l.to} className="ep-faire">
          <span className={`n ${l.bleu ? 'b' : ''}`}>{l.n}</span>
          <span className="t"><b>{l.titre}</b><small>{l.detail}</small></span>
          <span className="lien">{l.action}</span>
        </Link>
      ))}
    </section>
  )
}