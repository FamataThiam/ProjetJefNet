import { useRef, useState } from 'react'
import { useDemanderCertification, useEnregistrerPosition, useModifierProfilPro, useMonProfilPro, useMesServicesPro } from '../../api/espacePro'
import { erreursChamps, messageErreur } from '../../api/erreurs'
import useSession from '../../hooks/useSession'
import ChoixLieu from '../demandes/ChoixLieu'


export default function ProfilPro() {
  const pro = useMonProfilPro()
  if (pro.isPending) return <div className="ep-pp"><div className="ep-squelette" style={{ height: 520 }} /><div className="ep-squelette" style={{ height: 420 }} /></div>
  if (pro.isError) return <div className="verre ep-bientot"><b>Chargement impossible</b>{messageErreur(pro.error)}</div>
  return (
    <div className="ep-pp">
      <div className="ep-col">
        <Formulaire p={pro.data} />
        <Position p={pro.data} />
      </div>
      <Certification p={pro.data} />
    </div>
  )
}


function Formulaire({ p }) {
  const { user } = useSession()
  const m = user?.membre
  const modifier = useModifierProfilPro()
  const [f, setF] = useState({
    titre_professionnel: p.titre_professionnel ?? '', experience: p.experience ?? '', biographie: p.biographie ?? '',
    linkedin: p.linkedin ?? '', portfolio: p.portfolio ?? '', rayon_intervention: p.rayon_intervention ?? 'VILLE',
  })
  const changer = (c) => { setF((x) => ({ ...x, ...c })); modifier.reset() }
  const erreurs = erreursChamps(modifier.error)

 
  const modifs = Object.fromEntries(Object.entries(f).filter(([k, v]) => (v ?? '') !== (p[k] ?? '')).map(([k, v]) => [k, typeof v === 'string' ? (v.trim() || null) : v]))
  const aEnvoyer = Object.keys(modifs).length > 0
  const RAYONS = [
    ['LOCALITE', 'Mon quartier', m?.localite || 'ma localité'],
    ['VILLE', 'Ma ville', m?.ville || 'ma ville'],
    ['REGION', 'Ma région', `${m?.ville ?? 'ma ville'} et environs`],
    ['PAYS', 'Tout le pays', 'Sénégal'],
  ]
  const champ = (cle) => erreurs[cle] && <p className="rs-champ-err">{erreurs[cle]}</p>

  return (
    <section className="verre ep-panneau">
      <h3>Profil professionnel</h3>
      <label className="ep-lbl" htmlFor="pp-titre">Titre professionnel</label>
      <input id="pp-titre" className="rs-champ" maxLength={100} value={f.titre_professionnel} onChange={(e) => changer({ titre_professionnel: e.target.value })} />
      {champ('titre_professionnel')}

      <label className="ep-lbl" htmlFor="pp-bio">Présentation</label>
      <textarea id="pp-bio" className="rs-champ" rows={4} maxLength={2000} value={f.biographie} placeholder="Ton parcours, ta spécialité, ta façon de travailler…" onChange={(e) => changer({ biographie: e.target.value })} />
      {champ('biographie')}

      <div className="ep-trio">
        <div>
          <label className="ep-lbl" htmlFor="pp-exp">Expérience</label>
          <input id="pp-exp" className="rs-champ" maxLength={100} value={f.experience} placeholder="Ex. : 9 ans" onChange={(e) => changer({ experience: e.target.value })} />
        </div>
        <div>
          <label className="ep-lbl" htmlFor="pp-li">LinkedIn (facultatif)</label>
          <input id="pp-li" className="rs-champ" maxLength={255} value={f.linkedin} placeholder="https://linkedin.com/in/…" onChange={(e) => changer({ linkedin: e.target.value })} />
          {champ('linkedin')}
        </div>
        <div>
          <label className="ep-lbl" htmlFor="pp-pf">Portfolio (facultatif)</label>
          <input id="pp-pf" className="rs-champ" maxLength={255} value={f.portfolio} placeholder="https://…" onChange={(e) => changer({ portfolio: e.target.value })} />
          {champ('portfolio')}
        </div>
      </div>

      <span className="ep-lbl">Rayon d’intervention</span>
      <div className="ep-rayons">
        {RAYONS.map(([v, l, s]) => (
          <button key={v} type="button" className={`ep-rayon ${f.rayon_intervention === v ? 'on' : ''}`} onClick={() => changer({ rayon_intervention: v })}>
            <b>{l}</b><small>{s}</small>
          </button>
        ))}
      </div>
      <p className="rs-aide">Ton rayon décide des demandes que tu vois dans « À prendre ». Ta ville et ton quartier se changent dans ton espace client, onglet « Mon compte ».</p>

      {modifier.isError && !Object.keys(erreurs).length && <p className="rs-erreur">{messageErreur(modifier.error)}</p>}
      {modifier.isSuccess && <p className="rs-ok">Profil enregistré.</p>}
      <div className="rs-pied" style={{ justifyContent: 'flex-start' }}>
        <button type="button" className="rs-btn plein" disabled={!aEnvoyer || !f.titre_professionnel.trim() || modifier.isPending} onClick={() => modifier.mutate(modifs)}>
          {modifier.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </section>
  )
}


function Position({ p }) {
  const { user } = useSession()
  const enregistrer = useEnregistrerPosition()
  const actuelle = p.latitude !== null && p.longitude !== null ? { latitude: p.latitude, longitude: p.longitude, source: 'carte' } : null
  const [position, setPosition] = useState(actuelle)
  const change = position && (!actuelle || position.latitude !== actuelle.latitude || position.longitude !== actuelle.longitude)

  return (
    <section className="verre ep-panneau">
      <h3>Ma position<small>{actuelle ? 'Visible sur la carte, de façon approximative' : 'Pas encore placée'}</small></h3>
      <p className="rs-aide" style={{ marginTop: 6 }}>Elle sert à calculer la distance avec les clients. Sur la carte publique, ton point est légèrement décalé pour ne pas montrer ton adresse exacte.</p>
      <ChoixLieu position={position} ville={user?.membre?.ville ?? ''} onChange={(pos) => { setPosition(pos); enregistrer.reset() }} />
      {enregistrer.isError && <p className="rs-erreur">{messageErreur(enregistrer.error)}</p>}
      {enregistrer.isSuccess && !change && <p className="rs-ok">Position enregistrée.</p>}
      <div className="rs-pied" style={{ justifyContent: 'flex-start', marginTop: 12 }}>
        <button type="button" className="rs-btn plein" disabled={!change || enregistrer.isPending}
          onClick={() => enregistrer.mutate({ latitude: position.latitude, longitude: position.longitude })}>
          {enregistrer.isPending ? 'Enregistrement…' : 'Enregistrer ma position'}
        </button>
      </div>
    </section>
  )
}


function Certification({ p }) {
  const services = useMesServicesPro()
  const demander = useDemanderCertification()
  const [fichier, setFichier] = useState(null)
  const [alerte, setAlerte] = useState('')
  const choix = useRef(null)
  const statut = p.statut_certification
  const profilComplet = Boolean(p.titre_professionnel && p.biographie)
  const unService = (services.data ?? []).some((s) => s.est_actif)

  const choisir = (f) => {
    setAlerte('')
    if (!f) return
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)) return setAlerte('Formats acceptés : PDF, JPG ou PNG.')
    if (f.size > 5 * 1024 * 1024) return setAlerte('Le fichier ne doit pas dépasser 5 Mo.')
    setFichier(f)
  }

  const etat = {
    CERTIFIE: { titre: 'Tu es certifié', texte: 'Le badge apparaît sur ton profil, dans la recherche et sur la carte. Merci pour ta confiance.' },
    EN_ATTENTE: { titre: 'Demande en cours de vérification', texte: 'Un administrateur vérifie ton justificatif. Tu recevras une notification dès qu’il aura décidé.' },
    RETIRE: { titre: 'Badge retiré', texte: 'Ton badge a été retiré par un administrateur. Tu peux refaire une demande avec un justificatif à jour.' },
    REFUSE: { titre: 'Demande refusée', texte: 'Ton justificatif n’a pas été accepté. Tu peux envoyer un autre document plus lisible ou plus complet.' },
  }[statut] ?? { titre: 'Obtenir le badge Certifié', texte: 'Le badge rassure les clients : il apparaît sur ton profil, dans la recherche et sur la carte. Il n’est pas obligatoire pour recevoir des réservations.' }

  const peutDemander = statut !== 'CERTIFIE' && statut !== 'EN_ATTENTE'

  return (
    <section className={`verre ep-certif ${statut === 'CERTIFIE' ? 'ok' : ''}`}>
      <div className="badge">{statut === 'EN_ATTENTE' ? '…' : '✓'}</div>
      <h3>{etat.titre}</h3>
      <p>{etat.texte}</p>

      <div className="ep-etapes-c">
        <div><i className={profilComplet ? '' : 'non'}>{profilComplet ? '✓' : 1}</i>Profil professionnel complet (titre et présentation)</div>
        <div><i className={unService ? '' : 'non'}>{unService ? '✓' : 2}</i>Au moins un service actif</div>
        <div><i className={p.justificatif_envoye ? '' : 'non'}>{p.justificatif_envoye ? '✓' : 3}</i>Justificatif envoyé (CV, diplôme ou attestation)</div>
        <div><i className={statut === 'CERTIFIE' ? '' : 'non'}>{statut === 'CERTIFIE' ? '✓' : 4}</i>Vérification par un administrateur</div>
      </div>

      {peutDemander && (
        <>
          <button type="button" className={`ep-depot ${fichier ? 'plein' : ''}`} onClick={() => choix.current?.click()}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); choisir(e.dataTransfer.files?.[0]) }}>
            {fichier ? <><b>{fichier.name}</b><small>{(fichier.size / 1024 / 1024).toFixed(1).replace('.', ',')} Mo · cliquer pour changer</small></>
              : <>Glisse ton justificatif ici ou <b>choisis un fichier</b><small>PDF ou image, 5 Mo maximum</small></>}
          </button>
          <input ref={choix} type="file" hidden accept="application/pdf,image/jpeg,image/png" onChange={(e) => { choisir(e.target.files?.[0]); e.target.value = '' }} />
          {alerte && <p className="rs-champ-err">{alerte}</p>}
          {demander.isError && <p className="rs-erreur">{Object.values(erreursChamps(demander.error))[0] || messageErreur(demander.error)}</p>}
          <button type="button" className="rs-btn plein large" style={{ marginTop: 14 }} disabled={!fichier || demander.isPending} onClick={() => demander.mutate(fichier, { onSuccess: () => setFichier(null) })}>
            {demander.isPending ? 'Envoi…' : 'Demander la certification'}
          </button>
        </>
      )}
    </section>
  )
}