import { useEffect, useMemo, useState } from 'react'
import { erreursChamps, messageErreur } from '../../api/erreurs'
import {
  useActionReservation, useEcrireAvis, useEcrireRapport, useImageProtegee, usePayer, useRapport, useSignerRapport,
} from '../../api/reservations'
import useSession from '../../hooks/useSession'
import Modale from './Modale'
import PadSignature from './PadSignature'
import { fcfa } from './format'

function Erreur({ mutation }) {
  if (!mutation.isError) return null
  const champs = erreursChamps(mutation.error)
  return <p className="rs-erreur">{Object.values(champs)[0] || messageErreur(mutation.error)}</p>
}


export function FenetreMotif({ r, action, onFermer }) {
  const [raison, setRaison] = useState('')
  const agir = useActionReservation(r.id)
  const annuler = action === 'annuler'
  const valide = annuler ? raison.trim().length >= 5 : raison.trim().length === 0 || raison.trim().length >= 5

  return (
    <Modale titre={annuler ? 'Annuler la réservation' : 'Refuser la réservation'}
      sousTitre={annuler ? 'L’autre personne sera prévenue avec ton motif.' : 'Le client sera prévenu. Le motif est facultatif.'} onFermer={onFermer}>
      <label className="rs-lbl" htmlFor="motif">Motif{annuler ? '' : ' (facultatif)'}</label>
      <textarea id="motif" className="rs-champ" rows={4} maxLength={500} value={raison} onChange={(e) => setRaison(e.target.value)}
        placeholder={annuler ? 'Ex. : un empêchement de dernière minute' : 'Ex. : je ne suis pas disponible ce jour-là'} />
      <p className="rs-aide">{raison.trim().length > 0 && raison.trim().length < 5 ? 'Au moins 5 caractères.' : ' '}</p>
      <Erreur mutation={agir} />
      <div className="rs-pied">
        <button type="button" className="rs-btn contour" onClick={onFermer}>Retour</button>
        <button type="button" className="rs-btn rouge" disabled={!valide || agir.isPending}
          onClick={() => agir.mutate({ action, raison: raison.trim() || undefined }, { onSuccess: onFermer })}>
          {agir.isPending ? 'Envoi…' : annuler ? 'Annuler la réservation' : 'Refuser'}
        </button>
      </div>
    </Modale>
  )
}


const OPERATEURS = [['WAVE', 'Wave'], ['ORANGE_MONEY', 'Orange Money'], ['FREE_MONEY', 'Free Money']]

export function FenetrePaiement({ r, onFermer }) {
  const { user } = useSession()
  const [mode, setMode] = useState('MOBILE_MONEY')
  const [operateur, setOperateur] = useState('WAVE')
  const [telephone, setTelephone] = useState(() => (user?.membre?.telephone ?? '').replace(/\D/g, '').slice(-9))
  const payer = usePayer(r.id)
  const resultat = payer.data?.data

  const numeroValide = /^7[05678]\d{7}$/.test(telephone)
  const pret = mode !== 'MOBILE_MONEY' || numeroValide

  const envoyer = () => payer.mutate(mode === 'MOBILE_MONEY' ? { mode, operateur, telephone } : { mode })

 
  if (resultat) {
    const statut = resultat.statut
    return (
      <Modale titre={statut === 'PAYEE' ? 'Paiement réussi' : statut === 'ECHOUE' ? 'Paiement refusé' : 'Paiement en espèces enregistré'} onFermer={onFermer}>
        {statut === 'PAYEE' && <p className="rs-ok">{fcfa(resultat.montant)} payés. Ta facture est disponible dans les documents de la réservation.</p>}
        {statut === 'ECHOUE' && <p className="rs-erreur">L’opérateur a refusé le paiement. Vérifie ton solde ou essaie un autre numéro.</p>}
        {statut === 'EN_ATTENTE' && <p className="rs-ok">Remets {fcfa(resultat.montant)} au prestataire. Dès qu’il confirme la réception, ta facture sera générée.</p>}
        <div className="rs-pied">
          {statut === 'ECHOUE' && <button type="button" className="rs-btn contour" onClick={() => payer.reset()}>Réessayer</button>}
          <button type="button" className="rs-btn plein" onClick={onFermer}>Terminer</button>
        </div>
      </Modale>
    )
  }

  return (
    <Modale titre="Payer la prestation" sousTitre={`${r.prestataire?.nom} · ${r.services?.length} service${r.services?.length > 1 ? 's' : ''}`} onFermer={onFermer}>
      <div className="rs-modes">
        {[['MOBILE_MONEY', 'Mobile money', 'Wave, OM, Free'], ['CARTE', 'Carte', 'Visa, Mastercard'], ['ESPECES', 'Espèces', 'à confirmer par le prestataire']].map(([v, l, s]) => (
          <button key={v} type="button" className={`rs-mode ${mode === v ? 'on' : ''}`} onClick={() => setMode(v)}>{l}<small>{s}</small></button>
        ))}
      </div>

      {mode === 'MOBILE_MONEY' && (
        <>
          <span className="rs-lbl">Opérateur</span>
          <div className="rs-modes">
            {OPERATEURS.map(([v, l]) => <button key={v} type="button" className={`rs-mode ${operateur === v ? 'on' : ''}`} onClick={() => setOperateur(v)}>{l}</button>)}
          </div>
          <label className="rs-lbl" htmlFor="tel">Numéro qui va payer</label>
          <input id="tel" className="rs-champ" inputMode="numeric" placeholder="77 123 45 67" value={telephone}
            onChange={(e) => setTelephone(e.target.value.replace(/\D/g, '').slice(0, 9))} />
          {telephone && !numeroValide && <p className="rs-champ-err">9 chiffres commençant par 70, 75, 76, 77 ou 78.</p>}
        </>
      )}
      {mode === 'CARTE' && <p className="rs-aide">Paiement par carte simulé pour la démonstration : aucune donnée bancaire n’est demandée.</p>}
      {mode === 'ESPECES' && <p className="rs-aide">Tu remets l’argent au prestataire. La facture sera générée quand il confirmera la réception.</p>}

      <div className="rs-montant"><span>Montant</span><b>{fcfa(r.prix_final)}</b></div>
      <Erreur mutation={payer} />
      <button type="button" className="rs-btn plein large" disabled={!pret || payer.isPending} onClick={envoyer}>
        {payer.isPending ? 'Paiement en cours…' : mode === 'ESPECES' ? 'Je paie en espèces' : `Payer ${fcfa(r.prix_final)}`}
      </button>
    </Modale>
  )
}


export function FenetreAvis({ r, avis, onFermer }) {
  const [note, setNote] = useState(avis?.note ?? 0)
  const [commentaire, setCommentaire] = useState(avis?.commentaire ?? '')
  const ecrire = useEcrireAvis(r.id, Boolean(avis))
  const pret = note >= 1 && commentaire.trim().length >= 10

  return (
    <Modale titre={avis ? 'Modifier mon avis' : 'Laisser un avis'} sousTitre={`Ta note pour ${r.prestataire?.nom}`} onFermer={onFermer}>
      <div className="rs-etoiles" role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className={n <= note ? 'on' : ''} onClick={() => setNote(n)} aria-label={`${n} sur 5`}>★</button>
        ))}
      </div>
      <label className="rs-lbl" htmlFor="avis">Ton commentaire</label>
      <textarea id="avis" className="rs-champ" rows={4} maxLength={1000} value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
        placeholder="Ponctualité, qualité du travail, propreté…" />
      <p className="rs-aide">{commentaire.trim().length < 10 ? 'Au moins 10 caractères.' : `${commentaire.length} / 1000`}</p>
      <Erreur mutation={ecrire} />
      <div className="rs-pied">
        <button type="button" className="rs-btn contour" onClick={onFermer}>Annuler</button>
        <button type="button" className="rs-btn plein" disabled={!pret || ecrire.isPending}
          onClick={() => ecrire.mutate({ note, commentaire: commentaire.trim() }, { onSuccess: onFermer })}>
          {ecrire.isPending ? 'Envoi…' : avis ? 'Enregistrer' : 'Publier mon avis'}
        </button>
      </div>
    </Modale>
  )
}

function ChoixSignature({ setSignature }) {
  const { user } = useSession()
  const enregistree = user?.membre?.signature_url
  const [nouvelle, setNouvelle] = useState(!enregistree)

  if (enregistree && !nouvelle) {
    return (
      <div className="rs-sig-actuelle">
        <span>Ta signature enregistrée sera utilisée.<br /><button type="button" className="rs-lien" onClick={() => setNouvelle(true)}>Signer autrement</button></span>
        <img src={enregistree} alt="Ma signature" />
      </div>
    )
  }
  return (
    <>
      <PadSignature onChange={setSignature} />
      <p className="rs-aide">{enregistree ? 'Cette nouvelle signature remplacera celle de ton profil.' : 'Elle sera aussi enregistrée dans ton profil pour les prochaines fois.'}
        {enregistree && <> <button type="button" className="rs-lien" onClick={() => { setNouvelle(false); setSignature(null) }}>Garder l’ancienne</button></>}
      </p>
    </>
  )
}


function ChoixPhoto({ libelle, fichier, existante, onChange }) {
  const ancienne = useImageProtegee(fichier ? null : existante)
  const apercu = useMemo(() => (fichier ? URL.createObjectURL(fichier) : null), [fichier])
  useEffect(() => () => { if (apercu) URL.revokeObjectURL(apercu) }, [apercu])
  const src = fichier ? apercu : ancienne

  return (
    <label className="rs-photo">
      {src ? <img src={src} alt="" /> : <span>Ajouter la photo<br />« {libelle} »</span>}
      <em>{libelle}</em>
      <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onChange(f) }} />
    </label>
  )
}

export function FenetreRapport({ r, rapport, onFermer }) {
  const modifier = Boolean(rapport)
  const [description, setDescription] = useState(rapport?.description_prestation ?? '')
  const [observations, setObservations] = useState(rapport?.observations ?? '')
  const [avant, setAvant] = useState(null)
  const [apres, setApres] = useState(null)
  const [signature, setSignature] = useState(null)
  const ecrire = useEcrireRapport(r.id, modifier)
  const { user } = useSession()
  const signatureOk = modifier || signature || user?.membre?.signature_url
  const trop = [avant, apres].some((f) => f && f.size > 5 * 1024 * 1024)
  const pret = description.trim().length >= 20 && signatureOk && !trop

  const envoyer = () => ecrire.mutate({
    description_prestation: description.trim(),
    observations: observations.trim() || (modifier ? '' : null),
    photo_avant: avant,
    photo_apres: apres,
    signature: modifier ? null : signature,
  }, { onSuccess: onFermer })

  return (
    <Modale large titre={modifier ? 'Modifier le rapport' : 'Rédiger le rapport'}
      sousTitre={modifier ? 'Possible tant que le client ne l’a pas signé. Il sera prévenu.' : 'Décris le travail réalisé. Tu le signes en l’envoyant, puis le client le signe à son tour.'} onFermer={onFermer}>
      <label className="rs-lbl" htmlFor="desc">Travail réalisé</label>
      <textarea id="desc" className="rs-champ" rows={5} maxLength={3000} value={description} onChange={(e) => setDescription(e.target.value)}
        placeholder="Ex. : remplacement du tableau électrique, pose de 3 prises, test de tous les circuits…" />
      <p className="rs-aide">{description.trim().length < 20 ? `Au moins 20 caractères (${description.trim().length}/20).` : `${description.length} / 3000`}</p>

      <label className="rs-lbl" htmlFor="obs">Observations (facultatif)</label>
      <textarea id="obs" className="rs-champ" rows={3} maxLength={2000} value={observations} onChange={(e) => setObservations(e.target.value)}
        placeholder="Conseils au client, pièce à changer plus tard…" />

      <span className="rs-lbl">Photos (facultatives, 5 Mo maximum chacune)</span>
      <div className="rs-photos">
        <ChoixPhoto libelle="Avant" fichier={avant} existante={rapport?.photo_avant && `/reservations/${r.id}/rapport/photos/avant`} onChange={setAvant} />
        <ChoixPhoto libelle="Après" fichier={apres} existante={rapport?.photo_apres && `/reservations/${r.id}/rapport/photos/apres`} onChange={setApres} />
      </div>
      {trop && <p className="rs-champ-err">Une photo dépasse 5 Mo.</p>}

      {!modifier && (
        <>
          <span className="rs-lbl">Ta signature</span>
          <ChoixSignature setSignature={setSignature} />
        </>
      )}

      <Erreur mutation={ecrire} />
      <div className="rs-pied">
        <button type="button" className="rs-btn contour" onClick={onFermer}>Annuler</button>
        <button type="button" className="rs-btn plein" disabled={!pret || ecrire.isPending} onClick={envoyer}>
          {ecrire.isPending ? 'Envoi…' : modifier ? 'Enregistrer les modifications' : 'Signer et envoyer le rapport'}
        </button>
      </div>
    </Modale>
  )
}


function Photo({ chemin, libelle }) {
  const src = useImageProtegee(chemin)
  return <div className="rs-photo" style={{ cursor: 'default', borderStyle: 'solid' }}>{src ? <img src={src} alt={libelle} /> : <span>Chargement…</span>}<em>{libelle}</em></div>
}

export function LireRapport({ r, onFermer, onModifier }) {
  const rapport = useRapport(r.id, true)
  const signer = useSignerRapport(r.id)
  const [signature, setSignature] = useState(null)
  const { user } = useSession()
  const d = rapport.data
  const client = r.mon_role === 'CLIENT'
  const peutSigner = client && d && !d.signe_client_le
  const signatureOk = signature || user?.membre?.signature_url

  return (
    <Modale large titre="Rapport de prestation" sousTitre={d ? `N° ${d.numero}` : ''} onFermer={onFermer}>
      {rapport.isPending && <div className="rs-squelette" style={{ height: 220 }} />}
      {rapport.isError && <p className="rs-erreur">{messageErreur(rapport.error)}</p>}
      {d && (
        <>
          <span className="rs-lbl" style={{ marginTop: 0 }}>Travail réalisé</span>
          <p className="rs-texte-rapport">{d.description_prestation}</p>
          {d.observations && (<><span className="rs-lbl">Observations</span><p className="rs-texte-rapport">{d.observations}</p></>)}
          {(d.photo_avant || d.photo_apres) && (
            <>
              <span className="rs-lbl">Photos</span>
              <div className="rs-photos">
                {d.photo_avant && <Photo chemin={`/reservations/${r.id}/rapport/photos/avant`} libelle="Avant" />}
                {d.photo_apres && <Photo chemin={`/reservations/${r.id}/rapport/photos/apres`} libelle="Après" />}
              </div>
            </>
          )}
          <div className="rs-grille2">
            <div className="rs-info"><small>Signé par le prestataire</small><b>{d.signe_prestataire_le ? new Date(d.signe_prestataire_le).toLocaleDateString('fr-FR') : '—'}</b></div>
            <div className="rs-info"><small>Signé par le client</small><b>{d.signe_client_le ? new Date(d.signe_client_le).toLocaleDateString('fr-FR') : 'En attente'}</b></div>
          </div>

          {peutSigner && (
            <>
              <span className="rs-lbl">Ta signature</span>
              <ChoixSignature setSignature={setSignature} />
            </>
          )}
          <Erreur mutation={signer} />
          <div className="rs-pied">
            {!client && !d.signe_client_le && <button type="button" className="rs-btn contour" onClick={onModifier}>Modifier</button>}
            {peutSigner
              ? <button type="button" className="rs-btn plein" disabled={!signatureOk || signer.isPending} onClick={() => signer.mutate(signature, { onSuccess: onFermer })}>
                  {signer.isPending ? 'Signature…' : 'Signer le rapport'}
                </button>
              : <button type="button" className="rs-btn plein" onClick={onFermer}>Fermer</button>}
          </div>
        </>
      )}
    </Modale>
  )
}