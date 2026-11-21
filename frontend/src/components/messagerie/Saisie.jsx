import { useEffect, useRef, useState } from 'react'
import { duree } from './temps'

const MAX_OCTETS = 20 * 1024 * 1024 
const DOCUMENTS = '.pdf,.txt,.doc,.docx,.xls,.xlsx'
const MAX_VOCAL = 5 * 60 // 5 minutes

const typeDuFichier = (f) => (f.type.startsWith('image/') ? 'IMAGE' : f.type.startsWith('video/') ? 'VIDEO' : f.type.startsWith('audio/') ? 'AUDIO' : 'FICHIER')
const formatVocal = () => ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((t) => window.MediaRecorder?.isTypeSupported?.(t))


export default function Saisie({ reponse, onAnnulerReponse, onEnvoyer, onFrappe, desactive }) {
  const [texte, setTexte] = useState('')
  const [fichier, setFichier] = useState(null)
  const [menu, setMenu] = useState(false)
  const [erreur, setErreur] = useState('')
  const [enreg, setEnreg] = useState(null) 
  const champ = useRef(null)
  const choix = { document: useRef(null), media: useRef(null), photo: useRef(null) }
  const recorder = useRef(null)
  const morceaux = useRef([])


  useEffect(() => {
    const c = champ.current
    if (!c) return
    c.style.height = 'auto'
    c.style.height = `${Math.min(c.scrollHeight, 130)}px`
  }, [texte])

  useEffect(() => { if (reponse) champ.current?.focus() }, [reponse])

 
  const envoyer = () => {
    const contenu = texte.trim()
    if (!contenu && !fichier) return
    onEnvoyer({ contenu, fichier, type: fichier ? typeDuFichier(fichier) : 'TEXTE' })
    setTexte('')
    setFichier(null)
    setErreur('')
  }

  const choisirFichier = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    setMenu(false)
    if (!f) return
    if (f.size > MAX_OCTETS) return setErreur('Le fichier ne doit pas dépasser 20 Mo.')
    setErreur('')
    setFichier(f)
    champ.current?.focus()
  }

  
  const commencer = async () => {
    setErreur('')
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return setErreur('Ton navigateur ne permet pas d’enregistrer un vocal.')
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true })
      const type = formatVocal()
      const r = new MediaRecorder(flux, type ? { mimeType: type } : undefined)
      morceaux.current = []
      r.ondataavailable = (e) => e.data.size && morceaux.current.push(e.data)
      r.start()
      recorder.current = r
      setEnreg({ debut: Date.now(), secondes: 0 })
    } catch {
      setErreur('Micro refusé. Autorise-le dans ton navigateur pour envoyer un vocal.')
    }
  }

  const arreter = (envoi) => {
    const r = recorder.current
    if (!r) return
    r.onstop = () => {
      r.stream.getTracks().forEach((t) => t.stop())
      if (envoi && morceaux.current.length) {
        const type = (r.mimeType || 'audio/webm').split(';')[0]
        const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm'
        const blob = new Blob(morceaux.current, { type })
        onEnvoyer({ fichier: new File([blob], `vocal.${ext}`, { type }), vocal: true, type: 'AUDIO' })
      }
      recorder.current = null
    }
    r.stop()
    setEnreg(null)
  }

 
  useEffect(() => {
    if (!enreg) return
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - enreg.debut) / 1000)
      if (s >= MAX_VOCAL) arreter(true)
      else setEnreg((x) => (x ? { ...x, secondes: s } : x))
    }, 250)
    return () => clearInterval(t)
  }, [enreg?.debut]) 


  useEffect(() => () => recorder.current?.stream.getTracks().forEach((t) => t.stop()), [])

  const peutEnvoyer = texte.trim() || fichier

  return (
    <div className="bas-msg">
      {menu && (
        <div className="joindre" role="menu">
          <button type="button" onClick={() => choix.document.current.click()}><span style={{ background: '#7c3aed' }}>Doc</span>Document</button>
          <button type="button" onClick={() => choix.media.current.click()}><span style={{ background: '#db2777' }}>Img</span>Photo ou vidéo</button>
          <button type="button" onClick={() => choix.photo.current.click()}><span style={{ background: '#0174ab' }}>Cam</span>Appareil photo</button>
        </div>
      )}
      <input ref={choix.document} type="file" accept={DOCUMENTS} hidden onChange={choisirFichier} />
      <input ref={choix.media} type="file" accept="image/*,video/mp4,video/webm" hidden onChange={choisirFichier} />
      <input ref={choix.photo} type="file" accept="image/*" capture="environment" hidden onChange={choisirFichier} />

      {reponse && (
        <div className="reponse-en-cours">
          <div><b>Réponse à {reponse.est_moi ? 'vous-même' : reponse.nom}</b><span>{reponse.apercu}</span></div>
          <button type="button" className="bt" onClick={onAnnulerReponse} aria-label="Annuler la réponse">
            <svg viewBox="0 0 24 24" className="ic"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      )}
      {fichier && (
        <div className="piece-jointe">
          <span className="ext">{typeDuFichier(fichier) === 'IMAGE' ? 'IMG' : typeDuFichier(fichier) === 'VIDEO' ? 'VID' : 'DOC'}</span>
          <div><b>{fichier.name}</b><small>{(fichier.size / 1024 / 1024).toFixed(1)} Mo · ajoute un texte si tu veux</small></div>
          <button type="button" className="bt" onClick={() => setFichier(null)} aria-label="Retirer le fichier">
            <svg viewBox="0 0 24 24" className="ic"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      )}
      {erreur && <p className="erreur-saisie">{erreur}</p>}

      <div className="saisie-msg">
        {enreg ? (
          <div className="enreg">
            <button type="button" className="annuler-vocal" onClick={() => arreter(false)}>Annuler</button>
            <span className="pt" />
            <b>{duree(enreg.secondes)}</b>
            <div className="onde vive">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ animationDelay: `${(i % 7) * 0.12}s` }} />)}</div>
          </div>
        ) : (
          <div className="zone">
            <button type="button" className="bt" onClick={() => setMenu((x) => !x)} aria-label="Joindre un fichier" disabled={desactive}>
              <svg viewBox="0 0 24 24" className="ic"><path d="M21 12l-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 8" /></svg>
            </button>
            <textarea ref={champ} rows={1} value={texte} placeholder="Écrire un message" maxLength={5000} disabled={desactive}
              onChange={(e) => { setTexte(e.target.value); onFrappe() }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer() } }} />
          </div>
        )}

        {enreg ? (
          <button type="button" className="envoi" onClick={() => arreter(true)} aria-label="Envoyer le vocal">
            <svg viewBox="0 0 24 24" className="ic plein"><path d="M3 20l18-8L3 4v6l12 2-12 2z" /></svg>
          </button>
        ) : peutEnvoyer ? (
          <button type="button" className="envoi" onClick={envoyer} aria-label="Envoyer">
            <svg viewBox="0 0 24 24" className="ic plein"><path d="M3 20l18-8L3 4v6l12 2-12 2z" /></svg>
          </button>
        ) : (
          <button type="button" className="envoi" onClick={commencer} aria-label="Enregistrer un message vocal" disabled={desactive}>
            <svg viewBox="0 0 24 24" className="ic"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
          </button>
        )}
      </div>
    </div>
  )
}