import { useEffect, useMemo, useRef, useState } from 'react'
import Avatar from '../membre/Avatar'
import { duree } from './temps'

const NB_BARRES = 36


export default function LecteurVocal({ url, graine, auteur }) {
  const audio = useRef(null)
  const [joue, setJoue] = useState(false)
  const [avance, setAvance] = useState(0)
  const [total, setTotal] = useState(0)

  const barres = useMemo(() => {
    let x = String(graine).split('').reduce((t, c) => t * 31 + c.charCodeAt(0), 7) >>> 0
    return Array.from({ length: NB_BARRES }, () => { x = (x * 1103515245 + 12345) >>> 0; return 6 + (x % 22) })
  }, [graine])

  useEffect(() => {
    const a = audio.current
    if (!a) return

    const meta = () => {
      if (a.duration === Infinity || Number.isNaN(a.duration)) {
        a.currentTime = 1e101
        a.addEventListener('timeupdate', function fix() { a.removeEventListener('timeupdate', fix); setTotal(a.duration); a.currentTime = 0 })
      } else setTotal(a.duration)
    }
    const temps = () => setAvance(a.duration && Number.isFinite(a.duration) ? a.currentTime / a.duration : 0)
    const fin = () => { setJoue(false); setAvance(0) }
    a.addEventListener('loadedmetadata', meta)
    a.addEventListener('timeupdate', temps)
    a.addEventListener('ended', fin)
    return () => { a.removeEventListener('loadedmetadata', meta); a.removeEventListener('timeupdate', temps); a.removeEventListener('ended', fin) }
  }, [url])

  const basculer = () => {
    const a = audio.current
    if (joue) { a.pause(); setJoue(false) } else { a.play().then(() => setJoue(true)).catch(() => {}) }
  }

  const aller = (e) => {
    const a = audio.current
    const r = e.currentTarget.getBoundingClientRect()
    if (a.duration && Number.isFinite(a.duration)) a.currentTime = ((e.clientX - r.left) / r.width) * a.duration
  }

  const allumees = Math.round(avance * NB_BARRES)
  return (
    <div className="vocal">
      <Avatar nom={auteur?.nom} photo={auteur?.photo_url} taille="a40" />
      <button type="button" className="lire" onClick={basculer} aria-label={joue ? 'Pause' : 'Écouter'}>
        {joue
          ? <svg viewBox="0 0 24 24" className="ic plein"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
          : <svg viewBox="0 0 24 24" className="ic plein"><path d="M7 4l13 8-13 8z" /></svg>}
      </button>
      <div className="onde" onClick={aller} role="presentation">
        {barres.map((h, i) => <i key={i} className={i < allumees ? 'joue' : ''} style={{ height: h }} />)}
      </div>
      <small>{duree(joue || avance ? avance * total : total)}</small>
      <audio ref={audio} src={url} preload="metadata" />
    </div>
  )
}