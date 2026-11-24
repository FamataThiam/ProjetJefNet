import { Link } from 'react-router-dom'
import { useTableauDeBord } from '../../api/espacePro'
import { fcfa, jourCourt, numeroJour } from '../reservations/format'
import { Chaleur, Evolution, MiniCourbe } from './Graphiques'

const JOURS = { Lun: 'lundi', Mar: 'mardi', Mer: 'mercredi', Jeu: 'jeudi', Ven: 'vendredi', Sam: 'samedi', Dim: 'dimanche' }
const nombre = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(n).replace(/[\u202f\u00a0]/g, ' ')

// Onglet « Tableau de bord » de l'espace prestataire
export default function TableauDeBord() {
  const resume = useTableauDeBord('resume')
  const evolution = useTableauDeBord('evolution', { mois: 12 })
  const activite = useTableauDeBord('activite')
  const entonnoir = useTableauDeBord('entonnoir')
  const aFaire = useTableauDeBord('a-faire')

  if (resume.isError) {
    return <div className="verre ep-bientot"><b>Tableau de bord indisponible</b>Le serveur n’a pas pu calculer tes statistiques. Réessaie dans un instant.</div>
  }

  const periode = resume.data?.periode
  return (
    <>
      <div className="ep-periode">
        <h2>{periode?.libelle ?? ' '}</h2>
        {periode && <small>comparé à la même période du mois dernier, {periode.comparaison.libelle}</small>}
      </div>

      <div className="ep-kpis">
        {resume.isPending
          ? Array.from({ length: 8 }, (_, k) => <div key={k} className="ep-squelette" style={{ height: 132 }} />)
          : resume.data.cartes.map((c, k) => <Carte key={c.cle} c={c} delai={k * 40} />)}
      </div>

      <div className="ep-grille">
        <div className="ep-col">
          <section className="verre ep-panneau">
            <h3>Évolution sur 12 mois<small>Chiffre d’affaires et prestations</small></h3>
            <div className="ep-legende"><span><i className="ca" />Chiffre d’affaires</span><span><i className="pr" />Prestations terminées</span></div>
            {evolution.isPending ? <div className="ep-squelette" style={{ height: 210 }} />
              : evolution.data?.mois?.some((m) => m.chiffre_affaires || m.prestations) ? <Evolution mois={evolution.data.mois} />
                : <p className="ep-vide">Ta courbe apparaîtra dès ta première prestation terminée.</p>}
          </section>

          <div className="ep-duo">
            <section className="verre ep-panneau">
              <h3>Parcours des réservations</h3>
              {entonnoir.isPending ? <div className="ep-squelette" style={{ height: 200 }} /> : <Entonnoir etapes={entonnoir.data?.etapes ?? []} />}
            </section>
            <section className="verre ep-panneau">
              <h3>Quand on te réserve{activite.data?.meilleur_jour && <small>Meilleur jour : {JOURS[activite.data.meilleur_jour] ?? activite.data.meilleur_jour}</small>}</h3>
              {activite.isPending ? <div className="ep-squelette" style={{ height: 200 }} />
                : activite.data?.meilleur_jour ? <Chaleur lignes={activite.data.carte_chaleur} />
                  : <p className="ep-vide">Les jours et heures de tes réservations apparaîtront ici.</p>}
            </section>
          </div>
        </div>

        <div className="ep-col">
          <AFaire requete={aFaire} />
          <Prochaines liste={aFaire.data?.prochaines_interventions} charge={aFaire.isPending} />
          <DerniersAvis liste={aFaire.data?.derniers_avis} charge={aFaire.isPending} />
        </div>
      </div>
    </>
  )
}

// ---------- une carte chiffre clé ----------
function Carte({ c, delai }) {
  const vide = c.valeur === null || c.valeur === undefined || (c.cle === 'note' && !c.valeur)
  const valeur = vide ? '—' : nombre(c.valeur)
  let variation = c.complement
  if (c.variation !== null && c.variation !== undefined) {
    const signe = c.variation > 0 ? '+' : c.variation < 0 ? '−' : ''
    const ecart = c.unite === '%' && c.precedent !== null
      ? `${signe}${nombre(Math.abs(c.valeur - c.precedent))} point${Math.abs(c.valeur - c.precedent) >= 2 ? 's' : ''}`
      : `${signe}${nombre(Math.abs(c.variation))} %`
    variation = `${ecart} vs mois dernier`
  }

  return (
    <div className="verre ep-kpi" style={{ animationDelay: `${delai}ms` }}>
      <small>{c.libelle}</small>
      <b>{valeur}{!vide && c.unite && <em>{c.unite}</em>}</b>
      <span className={`ep-var ${c.favorable === true ? 'ok' : c.favorable === false ? 'ko' : ''}`}>{variation || (vide ? 'Pas encore de données' : 'Stable')}</span>
      {c.cle === 'acceptation' && !vide
        ? <div className="ep-jauge"><i style={{ width: `${Math.min(100, c.valeur)}%` }} /></div>
        : <MiniCourbe serie={c.serie} />}
    </div>
  )
}

// ---------- entonnoir ----------
function Entonnoir({ etapes }) {
  if (!etapes.length || etapes[0].valeur === 0) return <p className="ep-vide">Tes réservations reçues et leur avancement apparaîtront ici.</p>
  return (
    <div className="ep-entonnoir">
      {etapes.map((e) => (
        <div key={e.cle} className="ep-et" title={e.perte ? `${e.perte} de moins qu’à l’étape précédente` : undefined}>
          <span>{e.libelle.replace(' par le client', '').replace('Réservations reçues', 'Reçues')}</span>
          <span className="ep-barre-h"><i style={{ width: `${Math.max(e.pourcentage, 2)}%` }} /></span>
          <b>{e.valeur}</b>
        </div>
      ))}
    </div>
  )
}

// ---------- à faire ----------
function AFaire({ requete }) {
  const d = requete.data
  if (requete.isPending) return <section className="verre ep-panneau"><h3>À faire</h3><div className="ep-squelette" style={{ height: 180, marginTop: 12 }} /></section>

  const lien = (liste, parDefaut) => (liste?.length === 1 ? `/reservations/${liste[0].id}` : parDefaut)
  const premier = (liste) => liste?.[0]
  const lignes = [
    d?.reservations_a_confirmer?.length > 0 && {
      n: d.reservations_a_confirmer.length, titre: `Réservation${d.reservations_a_confirmer.length > 1 ? 's' : ''} à confirmer`,
      detail: `${premier(d.reservations_a_confirmer).client} · ${jourCourt(premier(d.reservations_a_confirmer).date)} ${numeroJour(premier(d.reservations_a_confirmer).date)} à ${premier(d.reservations_a_confirmer).heure}`,
      to: lien(d.reservations_a_confirmer, '/reservations?vue=recues&statut=EN_ATTENTE'), action: 'Voir',
    },
    d?.rapports_a_rediger?.length > 0 && {
      n: d.rapports_a_rediger.length, titre: `Rapport${d.rapports_a_rediger.length > 1 ? 's' : ''} à rédiger`,
      detail: `${premier(d.rapports_a_rediger).services?.[0] ?? 'Prestation'} · ${premier(d.rapports_a_rediger).client}`,
      to: lien(d.rapports_a_rediger, '/reservations?vue=recues&statut=TERMINEE'), action: 'Rédiger',
    },
    d?.especes_a_confirmer?.length > 0 && {
      n: d.especes_a_confirmer.length, titre: 'Paiement en espèces à confirmer',
      detail: `${fcfa(premier(d.especes_a_confirmer).prix)} · ${premier(d.especes_a_confirmer).client}`,
      to: lien(d.especes_a_confirmer, '/reservations?vue=recues&statut=TERMINEE'), action: 'Confirmer',
    },
    d?.demandes_disponibles > 0 && {
      n: d.demandes_disponibles, bleu: true, titre: `Demande${d.demandes_disponibles > 1 ? 's' : ''} à prendre`,
      detail: 'Dans ta zone et tes domaines', to: '/demandes?vue=a-prendre', action: 'Voir',
    },
  ].filter(Boolean)

  return (
    <section className="verre ep-panneau">
      <h3>À faire</h3>
      {lignes.length === 0 && <p className="ep-vide">Rien en attente. Tout est à jour.</p>}
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

function Prochaines({ liste, charge }) {
  return (
    <section className="verre ep-panneau">
      <h3>Prochaines interventions</h3>
      {charge ? <div className="ep-squelette" style={{ height: 120, marginTop: 12 }} />
        : !liste?.length ? <p className="ep-vide">Aucune intervention confirmée à venir.</p>
          : liste.slice(0, 4).map((r) => (
            <Link key={r.id} to={`/reservations/${r.id}`} className="ep-prochaine">
              <span className="d">{jourCourt(r.date)}<b>{numeroJour(r.date)}</b></span>
              <span><b>{r.services?.[0] ?? 'Prestation'}{r.services?.length > 1 ? ` + ${r.services.length - 1}` : ''}</b><small>{r.heure} · {r.client} · {fcfa(r.prix)}</small></span>
            </Link>
          ))}
    </section>
  )
}

function DerniersAvis({ liste, charge }) {
  return (
    <section className="verre ep-panneau">
      <h3>Derniers avis</h3>
      {charge ? <div className="ep-squelette" style={{ height: 100, marginTop: 12 }} />
        : !liste?.length ? <p className="ep-vide">Les avis de tes clients apparaîtront ici.</p>
          : liste.slice(0, 3).map((a, k) => (
            <div key={k} className="ep-avis">
              <span className="etoiles" aria-label={`${a.note} sur 5`}>{'★'.repeat(a.note)}<i>{'★'.repeat(5 - a.note)}</i></span>
              <small> · {a.auteur} · {a.il_y_a}</small>
              {a.commentaire && <p>{a.commentaire}</p>}
            </div>
          ))}
    </section>
  )
}