import Daily from '@daily-co/daily-js'
import { useEffect, useRef, useState } from 'react'
import Avatar from '../membre/Avatar'
import { IconeCamera, IconeMicro, IconeTel } from './AppelEntrant'

// branche une piste (audio ou vidéo) Daily sur un élément <video> / <audio>
function brancher(el, piste) {
  if (!el) return
  if (!piste) { el.srcObject = null; return }
  if (el.srcObject?.getTracks()[0]?.id === piste.id) return
  el.srcObject = new MediaStream([piste])
}
const piste = (p, type) => (p?.tracks?.[type]?.state === 'playable' ? p.tracks[type].persistentTrack : null)

// fin de l'appel précédent (voir plus bas)
let destruction = Promise.resolve()

const chrono = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

// L'appel vidéo : salle Daily, ma caméra en petit, l'autre en grand
export default function EcranAppel({ appel, onConnecte, onRaccrocher, onQuitte }) {
  const { salle, phase, interlocuteur } = appel
  const [micro, setMicro] = useState(true)
  const [camera, setCamera] = useState(true)
  const [videoAutre, setVideoAutre] = useState(false)
  const [secondes, setSecondes] = useState(0)
  const [erreur, setErreur] = useState('')
  const appelDaily = useRef(null)
  const maVideo = useRef(null)
  const sonVideo = useRef(null)
  const sonAudio = useRef(null)
  const rappels = useRef({ onConnecte, onQuitte })
  useEffect(() => { rappels.current = { onConnecte, onQuitte } })

  // on rejoint la salle dès qu'on a l'adresse et le jeton.
  // Daily n'accepte qu'un seul appel à la fois dans la page : on attend que l'ancien soit bien détruit
  // (en développement, React StrictMode monte et démonte deux fois ce composant).
  useEffect(() => {
    if (!salle) return
    let actif = true
    let call = null

    destruction = destruction.then(() => {
      if (!actif) return
      try {
        call = Daily.getCallInstance() ?? Daily.createCallObject({ subscribeToTracksAutomatically: true })
      } catch {
        setErreur('Impossible de démarrer la vidéo. Recharge la page et réessaie.')
        return
      }
      appelDaily.current = call

      const maj = () => {
        const tous = call.participants()
        const autre = Object.values(tous).find((p) => !p.local)
        brancher(maVideo.current, piste(tous.local, 'video'))
        brancher(sonVideo.current, piste(autre, 'video'))
        brancher(sonAudio.current, piste(autre, 'audio'))
        setVideoAutre(Boolean(piste(autre, 'video')))
        if (autre) rappels.current.onConnecte()
      }

      call
        .on('joined-meeting', maj)
        .on('participant-joined', maj)
        .on('participant-updated', maj)
        .on('track-started', maj)
        .on('track-stopped', maj)
        .on('participant-left', () => rappels.current.onQuitte())
        .on('error', (e) => setErreur(e?.errorMsg ?? 'Erreur de connexion à la salle.'))
        .on('camera-error', () => setErreur('Caméra ou micro inaccessible. Autorise-les dans ton navigateur.'))

      call.join({ url: salle.url, token: salle.jeton }).catch(() => setErreur('Impossible de rejoindre la salle vidéo.'))
    })

    return () => {
      actif = false
      appelDaily.current = null
      destruction = destruction.then(async () => {
        if (!call) return
        try { await call.leave() } catch { /* déjà sorti */ }
        try { await call.destroy() } catch { /* déjà détruit */ }
      })
    }
  }, [salle])

  // chronomètre une fois l'appel décroché
  useEffect(() => {
    if (phase !== 'encours') return
    const t = setInterval(() => setSecondes((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  const basculerMicro = () => { appelDaily.current?.setLocalAudio(!micro); setMicro(!micro) }
  const basculerCamera = () => { appelDaily.current?.setLocalVideo(!camera); setCamera(!camera) }

  const attente = phase === 'sortant'

  return (
    <div className="voile-appel" role="dialog" aria-label={`Appel vidéo avec ${interlocuteur?.nom}`}>
      <div className={`ecran-appel ${videoAutre ? 'avec-video' : ''}`}>
        <video ref={sonVideo} autoPlay playsInline className="video-autre" />
        <audio ref={sonAudio} autoPlay />

        {/* pas (encore) de vidéo de l'autre : sa photo au centre */}
        {!videoAutre && (
          <div className={`centre-appel ${attente ? 'attente' : ''}`}>
            <div className="ondes-appel"><i /><i /><Avatar nom={interlocuteur?.nom} photo={interlocuteur?.photo_url} taille="a140" /></div>
            <h3>{interlocuteur?.nom}</h3>
            <p>{erreur || (attente ? (salle ? 'Ça sonne…' : 'Appel en cours…') : `Caméra coupée · ${chrono(secondes)}`)}</p>
          </div>
        )}

        {videoAutre && (
          <div className="tete-appel"><b>{interlocuteur?.nom}</b><small>{chrono(secondes)}</small></div>
        )}

        <div className={`ma-camera ${camera ? '' : 'coupee'}`}>
          <video ref={maVideo} autoPlay playsInline muted />
          {!camera && <span>Caméra coupée</span>}
        </div>

        <div className="commandes-appel">
          <button type="button" className={micro ? '' : 'off'} onClick={basculerMicro} title={micro ? 'Couper le micro' : 'Activer le micro'}><IconeMicro barre={!micro} /></button>
          <button type="button" className={camera ? '' : 'off'} onClick={basculerCamera} title={camera ? 'Couper la caméra' : 'Activer la caméra'}><IconeCamera barre={!camera} /></button>
          <button type="button" className="raccrocher" onClick={onRaccrocher} title="Raccrocher"><IconeTel raccroche /></button>
        </div>
      </div>
    </div>
  )
}