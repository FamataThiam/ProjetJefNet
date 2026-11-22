import { Link } from 'react-router-dom'
import { messageErreur } from '../../api/erreurs'
import { useActionReservation, useConfirmerEspeces } from '../../api/reservations'
import { dateLongue, fcfa } from './format'

const aujourdhui = () => new Date().toISOString().slice(0, 10)


export default function CarteAction({ r, ouvrir }) {
  const agir = useActionReservation(r.id)
  const especes = useConfirmerEspeces(r.id)
  const contenu = r.mon_role === 'CLIENT' ? pourClient(r, ouvrir) : pourPrestataire(r, ouvrir, agir, especes)
  const erreur = agir.error || especes.error

  return (
    <section className="verre rs-action">
      <span className={`rs-eti ${contenu.ton ?? ''}`}>{contenu.eti}</span>
      <h3>{contenu.titre}</h3>
      <p>{contenu.texte}</p>
      {contenu.boutons}
      {erreur && <p className="rs-erreur">{messageErreur(erreur)}</p>}
    </section>
  )
}

function Bouton({ style = 'plein', onClick, children, disabled, enCours }) {
  return (
    <button type="button" className={`rs-btn ${style} large`} onClick={onClick} disabled={disabled || enCours}>
      {enCours ? 'Un instant…' : children}
    </button>
  )
}

function etatFin(r) {
  return {
    rapport: r.rapport?.statut ?? null,
    signe: r.rapport?.statut === 'SIGNE',
    paye: r.paiement?.statut === 'PAYEE',
    especes: r.paiement?.statut === 'EN_ATTENTE' && r.paiement?.mode === 'ESPECES',
  }
}

function pourClient(r, ouvrir) {
  const qui = r.prestataire?.nom?.split(' ')[0] ?? 'Le prestataire'
  const quand = `${dateLongue(r.date_prevue).toLowerCase()} à ${r.heure_prevue}`

  switch (r.statut) {
    case 'EN_ATTENTE':
      return {
        eti: 'En attente', ton: 'attente', titre: 'En attente de confirmation',
        texte: `${qui} doit confirmer ta réservation du ${quand}. Tu seras prévenu dès qu’il répond.`,
        boutons: <Bouton style="rouge" onClick={() => ouvrir('annuler')}>Annuler la réservation</Bouton>,
      }
    case 'CONFIRMEE':
      return {
        eti: 'Confirmée', ton: 'fait', titre: 'Rendez-vous confirmé',
        texte: `${qui} viendra le ${quand}, à l’adresse indiquée.`,
        boutons: <Bouton style="rouge" onClick={() => ouvrir('annuler')}>Annuler la réservation</Bouton>,
      }
    case 'EN_COURS':
      return { eti: 'En cours', ton: 'attente', titre: 'Prestation en cours', texte: `${qui} a démarré le travail. Tu pourras signer son rapport et payer quand il aura terminé.` }
    case 'TERMINEE': {
      const f = etatFin(r)
      const boutonPayer = !f.paye && !f.especes && <Bouton style={f.rapport === 'EN_ATTENTE_SIGNATURE' ? 'contour' : 'plein'} onClick={() => ouvrir('payer')}>Payer {fcfa(r.prix_final)}</Bouton>
      if (f.rapport === 'EN_ATTENTE_SIGNATURE') {
        return {
          eti: 'À toi de jouer', titre: 'Signe le rapport',
          texte: `${qui} a décrit le travail réalisé. Relis-le et signe-le. Tu peux payer avant ou après la signature.`,
          boutons: <><Bouton onClick={() => ouvrir('lire')}>Lire et signer le rapport</Bouton>{boutonPayer}</>,
        }
      }
      if (!f.paye && !f.especes) {
        return {
          eti: 'À toi de jouer', titre: 'Paie la prestation',
          texte: f.rapport ? 'Le rapport est signé. Il ne reste plus que le paiement.' : `${qui} prépare son rapport. Tu peux déjà payer si tu le souhaites.`,
          boutons: boutonPayer,
        }
      }
      if (f.especes) {
        return { eti: 'En attente', ton: 'attente', titre: 'Paiement en espèces', texte: `${qui} doit confirmer avoir reçu ${fcfa(r.prix_final)}. La facture sera générée ensuite.` }
      }
      if (!f.rapport) {
        return { eti: 'En attente', ton: 'attente', titre: 'Rapport en préparation', texte: `Paiement reçu. ${qui} doit encore rédiger le rapport de prestation, que tu signeras.` }
      }
      if (!r.avis) {
        return {
          eti: 'À toi de jouer', titre: 'Laisse un avis',
          texte: `Ton avis aide les autres clients à choisir et fait monter la note de ${qui}.`,
          boutons: <Bouton onClick={() => ouvrir('avis')}>Noter {qui}</Bouton>,
        }
      }
      return {
        eti: 'Terminé', ton: 'fait', titre: 'Tout est en ordre',
        texte: 'Rapport signé, prestation payée et avis publié. Tes documents sont disponibles ci-dessous.',
        boutons: <Bouton style="contour" onClick={() => ouvrir('avis')}>Modifier mon avis</Bouton>,
      }
    }
    case 'ANNULEE':
    case 'REFUSEE':
      return {
        eti: r.statut === 'ANNULEE' ? 'Annulée' : 'Refusée', ton: 'attente',
        titre: r.statut === 'ANNULEE' ? 'Réservation annulée' : 'Réservation refusée',
        texte: r.statut === 'ANNULEE' ? 'Cette réservation n’aura pas lieu.' : `${qui} ne peut pas assurer cette réservation. Tu peux choisir un autre créneau.`,
        boutons: r.prestataire?.uuid && <Link to={`/prestataires/${r.prestataire.uuid}/reserver`} className="rs-btn plein large">Réserver à nouveau</Link>,
      }
    default:
      return { eti: '', titre: r.statut, texte: '' }
  }
}

function pourPrestataire(r, ouvrir, agir, especes) {
  const qui = r.client?.nom?.split(' ')[0] ?? 'Le client'
  const quand = `${dateLongue(r.date_prevue).toLowerCase()} à ${r.heure_prevue}`
  const action = (a) => agir.mutate({ action: a })
  const enCours = (a) => agir.isPending && agir.variables?.action === a

  switch (r.statut) {
    case 'EN_ATTENTE':
      return {
        eti: 'À toi de jouer', titre: 'Nouvelle réservation',
        texte: `${qui} souhaite te réserver le ${quand}. Confirme si tu es disponible.`,
        boutons: <><Bouton onClick={() => action('confirmer')} enCours={enCours('confirmer')} disabled={agir.isPending}>Confirmer</Bouton>
          <Bouton style="rouge" onClick={() => ouvrir('refuser')} disabled={agir.isPending}>Refuser</Bouton></>,
      }
    case 'CONFIRMEE': {
      const tropTot = r.date_prevue > aujourdhui()
      return {
        eti: tropTot ? 'Confirmée' : 'À toi de jouer', ton: tropTot ? 'fait' : '',
        titre: tropTot ? 'Rendez-vous confirmé' : 'Démarre la prestation',
        texte: tropTot ? `Rendez-vous le ${quand}. Tu pourras démarrer la prestation ce jour-là.` : 'Une fois sur place, démarre la prestation : le client sera prévenu.',
        boutons: <><Bouton onClick={() => action('demarrer')} enCours={enCours('demarrer')} disabled={tropTot || agir.isPending}>Démarrer la prestation</Bouton>
          <Bouton style="rouge" onClick={() => ouvrir('annuler')} disabled={agir.isPending}>Annuler la réservation</Bouton></>,
      }
    }
    case 'EN_COURS':
      return {
        eti: 'À toi de jouer', titre: 'Termine la prestation',
        texte: 'Quand le travail est fini, termine la prestation. Tu pourras ensuite rédiger le rapport.',
        boutons: <Bouton onClick={() => action('terminer')} enCours={enCours('terminer')}>Terminer la prestation</Bouton>,
      }
    case 'TERMINEE': {
      const f = etatFin(r)
      if (f.especes) {
        return {
          eti: 'À toi de jouer', titre: 'Confirme le paiement',
          texte: `${qui} indique t’avoir payé ${fcfa(r.prix_final)} en espèces. Confirme la réception pour générer la facture.`,
          boutons: <><Bouton onClick={() => especes.mutate()} enCours={especes.isPending}>J’ai reçu {fcfa(r.prix_final)}</Bouton>
            {!f.rapport && <Bouton style="contour" onClick={() => ouvrir('rapport')}>Rédiger le rapport</Bouton>}</>,
        }
      }
      if (!f.rapport) {
        return {
          eti: 'À toi de jouer', titre: 'Rédige le rapport',
          texte: 'Décris le travail réalisé, ajoute des photos avant et après, puis signe. Le client le signera à son tour.',
          boutons: <Bouton onClick={() => ouvrir('rapport')}>Rédiger le rapport</Bouton>,
        }
      }
      if (!f.signe) {
        return {
          eti: 'En attente', ton: 'attente', titre: 'Signature du client attendue',
          texte: `${qui} a été invité à signer ton rapport. Tu peux encore le modifier tant qu’il ne l’a pas signé.`,
          boutons: <Bouton style="contour" onClick={() => ouvrir('lire')}>Voir ou modifier le rapport</Bouton>,
        }
      }
      if (!f.paye) {
        return { eti: 'En attente', ton: 'attente', titre: 'Paiement attendu', texte: `Le rapport est signé. ${qui} doit maintenant payer ${fcfa(r.prix_final)}.` }
      }
      return { eti: 'Terminé', ton: 'fait', titre: 'Prestation clôturée', texte: 'Rapport signé par les deux et paiement reçu. Les documents sont disponibles ci-dessous.' }
    }
    case 'ANNULEE':
    case 'REFUSEE':
      return {
        eti: r.statut === 'ANNULEE' ? 'Annulée' : 'Refusée', ton: 'attente',
        titre: r.statut === 'ANNULEE' ? 'Réservation annulée' : 'Réservation refusée',
        texte: 'Cette réservation n’aura pas lieu.',
      }
    default:
      return { eti: '', titre: r.statut, texte: '' }
  }
}