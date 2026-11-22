import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { messageErreur } from '../../api/erreurs'
import { telecharger, useAvis, usePaiements, useRapport, useReservation } from '../../api/reservations'
import Avatar from '../../components/membre/Avatar'
import BoutonEcrire from '../../components/profil/BoutonEcrire'
import CarteAction from '../../components/reservations/CarteAction'
import { FenetreAvis, FenetreMotif, FenetrePaiement, FenetreRapport, LireRapport } from '../../components/reservations/Fenetres'
import { STATUTS, dateHeure, dateLongue, dateSimple, fcfa, jourDe, titreServices } from '../../components/reservations/format'
import '../../components/reservations/reservations.css'

// /reservations/{uuid} : même page pour le client et le prestataire, seules les actions changent
export default function Reservation() {
  const { uuid } = useParams()
  const resa = useReservation(uuid)
  const [fenetre, setFenetre] = useState(null)
  const r = resa.data
  const avis = useAvis(uuid, Boolean(r?.avis) && fenetre === 'avis')

  if (resa.isPending) {
    return <Page><div className="rs-squelette" style={{ height: 60, width: 420 }} /><div className="rs-squelette" style={{ height: 380, marginTop: 22 }} /></Page>
  }
  if (resa.isError) {
    const introuvable = resa.error?.response?.status === 404
    return (
      <Page>
        <div className="verre rs-vide">
          <b>{introuvable ? 'Réservation introuvable' : 'Chargement impossible'}</b>
          {introuvable ? 'Elle n’existe pas ou ne te concerne pas.' : messageErreur(resa.error)}
          <div style={{ marginTop: 16 }}><Link to="/reservations" className="rs-btn clair">Mes réservations</Link></div>
        </div>
      </Page>
    )
  }

  const client = r.mon_role === 'CLIENT'
  const st = STATUTS[r.statut] ?? { libelle: r.statut, classe: 'ann' }
  const fermer = () => setFenetre(null)

  return (
    <Page>
      <div className="rs-ariane">
        <Link to={client ? '/reservations' : '/reservations?vue=recues'}>Réservations</Link><span>›</span><b>{titreServices(r.services)}</b>
      </div>
      <div className="rs-entete">
        <h1 className="rs-titre">Réservation du {jourDe(r.date_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</h1>
        <span className={`rs-st ${st.classe}`} style={{ fontSize: 13 }}>{st.libelle}</span>
      </div>

      <div className="rs-det">
        <div>
          <Suivi r={r} />

          <section className="verre rs-bloc" style={{ animationDelay: '.05s' }}>
            <h3>Détails</h3>
            {r.services?.map((s) => <div key={s.id} className="rs-ligne"><span>{s.nom}</span><b>{fcfa(s.prix)}</b></div>)}
            <div className="rs-total"><span>Total</span><b style={{ fontSize: 22 }}>{fcfa(r.prix_final)}</b></div>
            <div className="rs-grille2">
              <div className="rs-info"><small>Date et heure</small><b>{dateLongue(r.date_prevue)} à {r.heure_prevue}</b></div>
              <div className="rs-info"><small>Adresse</small><b>{r.adresse_intervention}</b></div>
              <div className="rs-info"><small>Type</small><b>{r.type === 'DEMANDE' ? 'Depuis une demande de service' : 'Réservation directe'}</b></div>
              <div className="rs-info"><small>Envoyée le</small><b>{dateHeure(r.cree_le)}</b></div>
            </div>
            {r.raison_annulation && <p className="rs-motif"><b>Motif : </b>{r.raison_annulation}</p>}
          </section>

          {r.statut === 'TERMINEE' && <Documents r={r} ouvrir={setFenetre} />}
        </div>

        <aside>
          <CarteAction r={r} ouvrir={setFenetre} />
          <Personne r={r} />
          {r.statut === 'TERMINEE' && <EtapesFin r={r} />}
        </aside>
      </div>

      {(fenetre === 'annuler' || fenetre === 'refuser') && <FenetreMotif r={r} action={fenetre} onFermer={fermer} />}
      {fenetre === 'payer' && <FenetrePaiement r={r} onFermer={fermer} />}
      {fenetre === 'lire' && <LireRapport r={r} onFermer={fermer} onModifier={() => setFenetre('modifier')} />}
      {fenetre === 'rapport' && <FenetreRapport r={r} onFermer={fermer} />}
      {fenetre === 'modifier' && <FenetreRapportExistant r={r} onFermer={fermer} />}
      {fenetre === 'avis' && (!r.avis || avis.data) && <FenetreAvis r={r} avis={r.avis ? avis.data : null} onFermer={fermer} />}
    </Page>
  )
}

// en modification, la fenêtre s'ouvre avec le texte actuel du rapport (déjà en cache après la lecture)
function FenetreRapportExistant({ r, onFermer }) {
  const rapport = useRapport(r.id, true)
  return rapport.data ? <FenetreRapport r={r} rapport={rapport.data} onFermer={onFermer} /> : null
}

// ---------- suivi en 5 étapes ----------
function Suivi({ r }) {
  const fin = r.rapport?.statut === 'SIGNE' && r.paiement?.statut === 'PAYEE'
  let etapes
  if (r.statut === 'ANNULEE' || r.statut === 'REFUSEE') {
    etapes = [
      { nom: 'Envoyée', date: dateSimple(r.cree_le), etat: 'fait' },
      ...(r.confirmee_le ? [{ nom: 'Confirmée', date: dateSimple(r.confirmee_le), etat: 'fait' }] : []),
      { nom: r.statut === 'ANNULEE' ? 'Annulée' : 'Refusée', date: dateSimple(r.annulee_le), etat: 'stop', signe: '×' },
    ]
  } else {
    const rang = { EN_ATTENTE: 1, CONFIRMEE: 2, EN_COURS: 3, TERMINEE: fin ? 5 : 4 }[r.statut] ?? 0
    etapes = [
      { nom: 'Envoyée', date: dateSimple(r.cree_le) },
      { nom: 'Confirmée', date: dateSimple(r.confirmee_le) },
      { nom: 'En cours' },
      { nom: 'Terminée' },
      { nom: 'Clôturée', date: fin ? '' : 'rapport et paiement' },
    ].map((e, i) => ({ ...e, etat: i < rang ? 'fait' : i === rang ? 'ici' : '' }))
    if (fin) etapes[4].etat = 'fait'
  }

  return (
    <section className="verre rs-bloc">
      <h3>Suivi</h3>
      <ol className="rs-suivi" style={{ gridTemplateColumns: `repeat(${etapes.length},1fr)` }}>
        {etapes.map((e, i) => (
          <li key={e.nom} className={e.etat}>
            <i>{e.signe ?? (e.etat === 'fait' ? '✓' : i + 1)}</i>{e.nom}<small>{e.date || ' '}</small>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ---------- rapport et facture ----------
function Documents({ r, ouvrir }) {
  const paye = r.paiement?.statut === 'PAYEE'
  const paiements = usePaiements(r.id, paye)
  const facture = paiements.data?.find((p) => p.statut === 'PAYEE' && p.facture)?.facture
  const [erreur, setErreur] = useState('')
  const signe = r.rapport?.statut === 'SIGNE'

  const charger = (chemin, nom) => { setErreur(''); telecharger(chemin, nom).catch((e) => setErreur(messageErreur(e))) }

  const etatRapport = !r.rapport
    ? (r.mon_role === 'CLIENT' ? 'Pas encore rédigé par le prestataire' : 'À rédiger')
    : signe ? 'Signé par les deux' : r.mon_role === 'CLIENT' ? 'En attente de ta signature' : 'En attente de la signature du client'

  return (
    <section className="verre rs-bloc" style={{ animationDelay: '.1s' }}>
      <h3>Documents</h3>
      <div className={`rs-doc ${r.rapport ? '' : 'off'}`}>
        <span className="rs-pdf">PDF</span>
        <div><b>Rapport de prestation</b><small>{etatRapport}</small></div>
        {r.rapport && (
          <div className="rs-btns">
            <button type="button" className="rs-btn clair petit" onClick={() => ouvrir('lire')}>Lire</button>
            {signe && <button type="button" className="rs-btn contour petit" onClick={() => charger(`/reservations/${r.id}/rapport/pdf`, 'rapport-prestation.pdf')}>Télécharger</button>}
          </div>
        )}
      </div>
      <div className={`rs-doc ${paye ? '' : 'off'}`}>
        <span className="rs-pdf">PDF</span>
        <div><b>Facture{facture ? ` ${facture.numero}` : ''}</b><small>{paye ? `Émise le ${facture?.emise_le ? jourDe(facture.emise_le).toLocaleDateString('fr-FR') : '…'}` : 'Disponible après le paiement'}</small></div>
        {paye && (
          <div className="rs-btns">
            <button type="button" className="rs-btn contour petit" onClick={() => charger(`/reservations/${r.id}/facture`, `facture-${facture?.numero ?? 'jefnet'}.pdf`)}>Télécharger</button>
          </div>
        )}
      </div>
      {erreur && <p className="rs-erreur">{erreur}</p>}
    </section>
  )
}

// ---------- l'autre personne ----------
function Personne({ r }) {
  const client = r.mon_role === 'CLIENT'
  const p = client ? r.prestataire : r.client
  if (!p) return null
  const voirTel = !['ANNULEE', 'REFUSEE'].includes(r.statut)

  return (
    <section className="verre rs-mini">
      <div className="rs-pres">
        <Avatar nom={p.nom ?? ''} photo={p.photo_url} couleur={p.couleur} px={48} />
        <div>
          <b>{p.nom}</b>
          <small>{[client ? p.titre : 'Client', voirTel && p.telephone].filter(Boolean).join(' · ')}</small>
        </div>
      </div>
      <div className="rs-btns">
        <BoutonEcrire uuidPrestataire={p.uuid} lienConnexion="/connexion" className="rs-btn clair" />
        {client && p.uuid && <Link to={`/prestataires/${p.uuid}`} className="rs-btn contour">Voir le profil</Link>}
      </div>
    </section>
  )
}

// ---------- check-list de fin ----------
function EtapesFin({ r }) {
  const client = r.mon_role === 'CLIENT'
  const lignes = [
    ['Rapport rédigé par le prestataire', Boolean(r.rapport)],
    [client ? 'Ta signature' : 'Signature du client', r.rapport?.statut === 'SIGNE'],
    ['Paiement', r.paiement?.statut === 'PAYEE'],
    [client ? 'Ton avis' : 'Avis du client', Boolean(r.avis)],
  ]
  return (
    <section className="verre rs-mini">
      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Étapes de fin</h3>
      {lignes.map(([texte, ok], i) => (
        <div key={texte} className="rs-fin-etape"><span className={`rs-rond ${ok ? 'oui' : ''}`}>{ok ? '✓' : i + 1}</span>{texte}</div>
      ))}
    </section>
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