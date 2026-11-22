import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccepterDemande, useMesServices } from '../../api/demandes'
import { erreursChamps, messageErreur } from '../../api/erreurs'
import Modale from '../reservations/Modale'
import { fcfa } from '../reservations/format'
import { distance } from './temps'

const aujourdhui = () => new Date().toISOString().slice(0, 10)


export default function FenetreAccepter({ demande, onFermer }) {
  const navigate = useNavigate()
  const services = useMesServices()
  const accepter = useAccepterDemande(demande.id)


  const possibles = (services.data ?? []).filter((s) => s.est_actif && s.domaine?.id === demande.domaine.id)
  const [serviceId, setServiceId] = useState(null)
  const choisi = possibles.find((s) => s.id === serviceId) ?? possibles[0]
  const [date, setDate] = useState(aujourdhui())
  const [heure, setHeure] = useState('')
  const [prix, setPrix] = useState(null)
  const montant = prix ?? choisi?.prix ?? 0

  const erreurs = erreursChamps(accepter.error)
  const pret = choisi && date >= aujourdhui() && /^\d{2}:\d{2}$/.test(heure) && montant >= 0

  const envoyer = () => accepter.mutate(
    { service_id: choisi.id, date_prevue: date, heure_prevue: heure, prix_final: montant },
    { onSuccess: (r) => navigate(`/reservations/${r.id}`) },
  )

  return (
    <Modale titre="Accepter la demande" sousTitre={[demande.titre, demande.localite || demande.ville, distance(demande.distance_km)].filter(Boolean).join(' · ')} onFermer={onFermer}>
      <div className="dm-desc">{demande.description}</div>

      {services.isPending && <div className="rs-squelette" style={{ height: 52, marginTop: 14 }} />}
      {services.isSuccess && possibles.length === 0 && (
        <p className="rs-erreur">Tu n’as aucun service actif en {demande.domaine.libelle.toLowerCase()}. Ajoute ou réactive-en un depuis ton espace prestataire.</p>
      )}

      {possibles.length > 0 && (
        <>
          <label className="dm-lbl" htmlFor="svc">Ton service</label>
          <select id="svc" className="rs-champ dm-select" value={choisi?.id ?? ''} onChange={(e) => { setServiceId(Number(e.target.value)); setPrix(null) }}>
            {possibles.map((s) => <option key={s.id} value={s.id}>{s.nom} · {fcfa(s.prix)}</option>)}
          </select>
          {erreurs.service_id && <p className="rs-champ-err">{erreurs.service_id}</p>}

          <div className="dm-grille">
            <div>
              <label className="dm-lbl" htmlFor="date">Date</label>
              <input id="date" type="date" className="rs-champ" min={aujourdhui()} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="dm-lbl" htmlFor="heure">Heure</label>
              <input id="heure" type="time" className="rs-champ" value={heure} onChange={(e) => setHeure(e.target.value)} />
            </div>
          </div>
          {(erreurs.date_prevue || erreurs.heure_prevue) && <p className="rs-champ-err">{erreurs.date_prevue || erreurs.heure_prevue}</p>}

          <label className="dm-lbl" htmlFor="prix">Ton prix</label>
          <div className="dm-prix">
            <input id="prix" className="rs-champ" inputMode="numeric" value={montant} onChange={(e) => setPrix(Number(e.target.value.replace(/\D/g, '').slice(0, 8)))} />
            <span>F CFA</span>
          </div>
          <p className="rs-aide">Par défaut, le prix de ton service. Ajuste-le selon le travail décrit.</p>

          <div className="rs-montant"><span>Le client recevra une réservation confirmée</span><b>{fcfa(montant)}</b></div>
          {accepter.isError && !Object.keys(erreurs).length && <p className="rs-erreur" style={{ marginTop: 0, marginBottom: 12 }}>{messageErreur(accepter.error)}</p>}
          <button type="button" className="rs-btn plein large" disabled={!pret || accepter.isPending} onClick={envoyer}>
            {accepter.isPending ? 'Un instant…' : 'Accepter et créer la réservation'}
          </button>
        </>
      )}
    </Modale>
  )
}