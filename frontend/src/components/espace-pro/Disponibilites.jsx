import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAjouterDispo, useCopierDispos, useMesDisponibilites, useModifierDispo, useSupprimerDispo } from '../../api/espacePro'
import { erreursChamps, messageErreur } from '../../api/erreurs'
import { useReservations } from '../../api/reservations'
import Modale from '../reservations/Modale'

const H_DEBUT = 6, H_FIN = 22, PX = 44           
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const ACTIVES = ['EN_ATTENTE', 'CONFIRMEE', 'EN_COURS']


const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const plus = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const lundiDe = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x }
const enMin = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b }
const enHeure = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const dureeTexte = (min) => (min % 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}` : `${min / 60} h`)


export default function Disponibilites() {
  const navigate = useNavigate()
  const dispos = useMesDisponibilites()
  const resas = useReservations('recues', '')
  const copier = useCopierDispos()
  const [lundi, setLundi] = useState(() => lundiDe(new Date()))
  const [fenetre, setFenetre] = useState(null)     // { jour, debut, fin, id? }
  const [trace, setTrace] = useState(null)         // plage en cours de dessin { jour, a, b }
  const dessin = useRef(null)

  const aujourdhui = iso(new Date())
  const jours = Array.from({ length: 7 }, (_, i) => iso(plus(lundi, i)))
  const cetteSemaine = iso(lundiDe(new Date())) === iso(lundi)


  const parJour = (() => {
    const r = Object.fromEntries(jours.map((j) => [j, { plages: [], resas: [] }]))
    for (const d of dispos.data ?? []) if (r[d.jour]) r[d.jour].plages.push(d)
    for (const x of (resas.data?.pages ?? []).flatMap((p) => p.data)) {
      if (r[x.date_prevue] && ACTIVES.includes(x.statut)) r[x.date_prevue].resas.push(x)
    }
    return r
  })()


  const minutesA = (e, col) => {
    const y = e.clientY - col.getBoundingClientRect().top
    const m = H_DEBUT * 60 + Math.round((y / PX) * 2) * 30            // pas de 30 min
    return Math.max(H_DEBUT * 60, Math.min(H_FIN * 60, m))
  }
  const commencer = (e, jour) => {
    if (jour < aujourdhui || e.target !== e.currentTarget) return
    const m = minutesA(e, e.currentTarget)
    dessin.current = { jour, depart: m, col: e.currentTarget }
    e.currentTarget.setPointerCapture(e.pointerId)
    setTrace({ jour, a: m, b: Math.min(m + 60, H_FIN * 60) })
  }
  const bouger = (e) => {
    const d = dessin.current
    if (!d) return
    const m = minutesA(e, d.col)
    setTrace({ jour: d.jour, a: Math.min(d.depart, m), b: Math.max(d.depart + 30, m) })
  }
  const finir = () => {
    if (!dessin.current || !trace) return
    dessin.current = null
    setFenetre({ jour: trace.jour, debut: enHeure(trace.a), fin: enHeure(Math.max(trace.b, trace.a + 30)) })
  }


  const plagesSemaine = jours.flatMap((j) => parJour[j].plages)
  const copierSur = (n) => {
    const aCopier = []
    for (let k = 1; k <= n; k++) {
      for (const p of plagesSemaine) {
        const jour = iso(plus(new Date(`${p.jour}T12:00:00`), 7 * k))
        if (jour >= aujourdhui) aCopier.push({ jour_disponibilite: jour, heure_debut: p.heure_debut, heure_fin: p.heure_fin })
      }
    }
    copier.mutate(aCopier)
  }

  const debutSem = plus(lundi, 0).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  const finSem = plus(lundi, 6).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <div className="ep-outils">
        <h2>Disponibilités</h2>
        <span>Semaine du {debutSem} au {finSem}</span>
        <div className="ep-nav-sem">
          <button type="button" aria-label="Semaine précédente" disabled={cetteSemaine} onClick={() => setLundi((l) => plus(l, -7))}>‹</button>
          <button type="button" disabled={cetteSemaine} onClick={() => setLundi(lundiDe(new Date()))}>Cette semaine</button>
          <button type="button" aria-label="Semaine suivante" onClick={() => setLundi((l) => plus(l, 7))}>›</button>
        </div>
      </div>
      <div className="ep-legende-e">
        <span><i className="l1" />Disponible</span><span><i className="l2" />Réservé par un client</span><span><i className="l3" />En cours d’ajout</span>
        <span className="astuce">Clique-glisse dans une colonne pour ajouter une plage · clique sur une plage pour la modifier</span>
      </div>

      {dispos.isError && <p className="rs-erreur" style={{ marginBottom: 12 }}>{messageErreur(dispos.error)}</p>}

      <div className="verre ep-edt-cadre">
        <div className="ep-edt">
          <div className="ep-edt-tete">
            <div />
            {jours.map((j, i) => {
              const total = parJour[j].plages.reduce((t, p) => t + enMin(p.heure_fin) - enMin(p.heure_debut), 0)
              return (
                <div key={j} className={`tj ${j === aujourdhui ? 'auj' : ''} ${j < aujourdhui ? 'passe' : ''}`}>
                  <small>{JOURS[i]}</small><b>{Number(j.slice(8))}</b><span>{total ? dureeTexte(total) : 'Aucune'}</span>
                </div>
              )
            })}
          </div>
          <div className="ep-edt-corps" style={{ height: (H_FIN - H_DEBUT) * PX }}>
            <div className="heures">
              {Array.from({ length: H_FIN - H_DEBUT + 1 }, (_, i) => <span key={i} style={{ top: i * PX - 7 }}>{String(H_DEBUT + i).padStart(2, '0')}:00</span>)}
            </div>
            <div className="grille-h">
              {Array.from({ length: H_FIN - H_DEBUT + 1 }, (_, i) => <i key={i} style={{ top: i * PX }} />)}
              <div className="cols">
                {jours.map((j) => (
                  <div key={j} className={`col ${j === aujourdhui ? 'auj' : ''} ${j < aujourdhui ? 'passe' : ''}`}
                    onPointerDown={(e) => commencer(e, j)} onPointerMove={bouger} onPointerUp={finir}>
                    {parJour[j].plages.map((p) => {
                      const a = enMin(p.heure_debut), b = enMin(p.heure_fin)
                      return (
                        <button key={p.id} type="button" className="pl dispo" style={{ top: (a / 60 - H_DEBUT) * PX + 1, height: ((b - a) / 60) * PX - 3 }}
                          onClick={() => setFenetre({ id: p.id, jour: p.jour, debut: p.heure_debut, fin: p.heure_fin, reservee: !p.est_disponible })}>
                          <b>{p.heure_debut} – {p.heure_fin}</b><small>Disponible</small>
                        </button>
                      )
                    })}
                    {parJour[j].resas.map((r) => {
                      const a = enMin(r.heure_prevue)
                      return (
                        <button key={r.id} type="button" className="pl pris" style={{ top: (a / 60 - H_DEBUT) * PX + 1, height: PX - 3 }}
                          onClick={() => navigate(`/reservations/${r.id}`)} title="Ouvrir la réservation">
                          <b>{r.heure_prevue} · {r.client?.nom?.split(' ')[0]}</b><small>{r.services?.[0]?.nom ?? 'Réservation'}</small>
                        </button>
                      )
                    })}
                    {trace?.jour === j && (
                      <div className="pl fantome" style={{ top: (trace.a / 60 - H_DEBUT) * PX + 1, height: ((trace.b - trace.a) / 60) * PX - 3 }}>
                        <b>{enHeure(trace.a)} – {enHeure(trace.b)}</b><small>Nouvelle plage</small>
                      </div>
                    )}
                    {j === aujourdhui && <Maintenant />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="verre ep-modele">
        <p><b>Copier cette semaine</b> sur les semaines suivantes pour ne pas tout ressaisir. Une plage qui chevauche une plage déjà enregistrée est ignorée.</p>
        <button type="button" className="rs-btn clair" disabled={!plagesSemaine.length || copier.isPending} onClick={() => copierSur(2)}>Copier sur 2 semaines</button>
        <button type="button" className="rs-btn contour" disabled={!plagesSemaine.length || copier.isPending} onClick={() => copierSur(4)}>Sur 4 semaines</button>
      </div>
      {copier.isPending && <p className="rs-aide">Copie en cours…</p>}
      {copier.isSuccess && (
        <p className="rs-ok">{copier.data.ajoutees} plage{copier.data.ajoutees > 1 ? 's' : ''} ajoutée{copier.data.ajoutees > 1 ? 's' : ''}{copier.data.ignorees ? `, ${copier.data.ignorees} ignorée${copier.data.ignorees > 1 ? 's' : ''} (déjà occupée${copier.data.ignorees > 1 ? 's' : ''})` : ''}.</p>
      )}

      {fenetre && <FenetrePlage plage={fenetre} onFermer={() => { setFenetre(null); setTrace(null) }} />}
    </>
  )
}


function Maintenant() {
  const n = new Date()
  const h = n.getHours() + n.getMinutes() / 60
  if (h < H_DEBUT || h > H_FIN) return null
  return <span className="ep-maintenant" style={{ top: (h - H_DEBUT) * PX }} />
}


function FenetrePlage({ plage, onFermer }) {
  const [debut, setDebut] = useState(plage.debut)
  const [fin, setFin] = useState(plage.fin)
  const ajouter = useAjouterDispo()
  const modifier = useModifierDispo()
  const supprimer = useSupprimerDispo()
  const enCours = ajouter.isPending || modifier.isPending || supprimer.isPending
  const erreur = ajouter.error || modifier.error || supprimer.error
  const erreurs = erreursChamps(erreur)
  const valide = /^\d{2}:\d{2}$/.test(debut) && /^\d{2}:\d{2}$/.test(fin) && fin > debut
  const titreJour = new Date(`${plage.jour}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const enregistrer = () => {
    const donnees = { jour_disponibilite: plage.jour, heure_debut: debut, heure_fin: fin }
    if (plage.id) modifier.mutate({ id: plage.id, ...donnees }, { onSuccess: onFermer })
    else ajouter.mutate(donnees, { onSuccess: onFermer })
  }

  return (
    <Modale titre={plage.id ? 'Modifier la plage' : 'Nouvelle plage'} sousTitre={titreJour.charAt(0).toUpperCase() + titreJour.slice(1)} onFermer={onFermer}>
      {plage.reservee ? (
        <p className="rs-aide" style={{ marginTop: 0, fontSize: 14 }}>Cette plage est liée à une réservation : elle ne peut plus être modifiée ni supprimée.</p>
      ) : (
        <>
          <div className="dm-grille">
            <div><label className="ep-lbl haut" htmlFor="pl-debut">Début</label><input id="pl-debut" type="time" step="1800" className="rs-champ" value={debut} onChange={(e) => setDebut(e.target.value)} /></div>
            <div><label className="ep-lbl haut" htmlFor="pl-fin">Fin</label><input id="pl-fin" type="time" step="1800" className="rs-champ" value={fin} onChange={(e) => setFin(e.target.value)} /></div>
          </div>
          {!valide && <p className="rs-champ-err">L’heure de fin doit être après l’heure de début.</p>}
          {valide && <p className="rs-aide">Les clients pourront réserver un créneau d’une heure dans cette plage ({dureeTexte(enMin(fin) - enMin(debut))}).</p>}
        </>
      )}
      {erreur && <p className="rs-erreur">{Object.values(erreurs)[0] || messageErreur(erreur)}</p>}
      <div className="rs-pied">
        {plage.id && !plage.reservee && (
          <button type="button" className="rs-btn rouge" style={{ marginRight: 'auto' }} disabled={enCours} onClick={() => supprimer.mutate(plage.id, { onSuccess: onFermer })}>
            {supprimer.isPending ? 'Suppression…' : 'Supprimer'}
          </button>
        )}
        <button type="button" className="rs-btn contour" onClick={onFermer}>{plage.reservee ? 'Fermer' : 'Annuler'}</button>
        {!plage.reservee && (
          <button type="button" className="rs-btn plein" disabled={!valide || enCours} onClick={enregistrer}>
            {ajouter.isPending || modifier.isPending ? 'Enregistrement…' : plage.id ? 'Enregistrer' : 'Ajouter la plage'}
          </button>
        )}
      </div>
    </Modale>
  )
}