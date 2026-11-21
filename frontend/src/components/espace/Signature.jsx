import { useEffect, useRef, useState } from 'react'
import { messageErreur } from '../../api/auth'
import { useChangerSignature } from '../../api/compte'


export default function Signature({ url }) {
  const toile = useRef(null)
  const dessin = useRef(false)
  const [traceFait, setTraceFait] = useState(false)
  const [fichier, setFichier] = useState(null)
  const [apercuFichier, setApercuFichier] = useState(null)
  const [erreur, setErreur] = useState('')
  const envoyer = useChangerSignature()

  // la toile garde la taille réelle de son cadre (écran net, même sur téléphone)
  useEffect(() => {
    const c = toile.current
    const ajuster = () => {
      const r = c.getBoundingClientRect()
      c.width = r.width * devicePixelRatio
      c.height = r.height * devicePixelRatio
      const ctx = c.getContext('2d')
      ctx.scale(devicePixelRatio, devicePixelRatio)
      ctx.lineWidth = 2.6
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#0b1b33'
      setTraceFait(false)
    }
    ajuster()
    addEventListener('resize', ajuster)
    return () => removeEventListener('resize', ajuster)
  }, [])

  useEffect(() => () => apercuFichier && URL.revokeObjectURL(apercuFichier), [apercuFichier])

  const point = (e) => {
    const r = toile.current.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }
  const commencer = (e) => {
    if (fichier) return
    e.preventDefault()
    if (envoyer.isSuccess) envoyer.reset()
    dessin.current = true
    toile.current.setPointerCapture(e.pointerId)
    const ctx = toile.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(...point(e))
  }
  const tracer = (e) => {
    if (!dessin.current) return
    const ctx = toile.current.getContext('2d')
    ctx.lineTo(...point(e))
    ctx.stroke()
    setTraceFait(true)
    setErreur('')
  }
  const arreter = () => { dessin.current = false }


  const vider = () => {
    const c = toile.current
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
    setTraceFait(false)
    setFichier(null)
    setApercuFichier(null)
    setErreur('')
  }
  const effacer = () => { vider(); envoyer.reset() }

  const importer = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (f.type !== 'image/png') return setErreur('La signature doit être une image PNG.')
    if (f.size > 1024 * 1024) return setErreur('La signature ne doit pas dépasser 1 Mo.')
    effacer()
    setFichier(f)
    setApercuFichier(URL.createObjectURL(f))
  }

  const enregistrer = () => {
    const reussite = { onSuccess: vider }
    if (fichier) return envoyer.mutate(fichier, reussite)
    toile.current.toBlob((blob) => envoyer.mutate(blob, reussite), 'image/png')
  }

  const pret = traceFait || fichier

  return (
    <section className="verre carte-espace">
      <h2>Ma signature</h2>
      <p className="aide">Elle sert à signer les rapports de fin de prestation.</p>

      {url && !pret && (
        <div className="signature-actuelle">
          <span>Signature enregistrée</span>
          <img src={url} alt="Ma signature" />
        </div>
      )}

      <div className="pad-signature">
        <canvas ref={toile} onPointerDown={commencer} onPointerMove={tracer} onPointerUp={arreter} onPointerLeave={arreter} />
        {apercuFichier && <img src={apercuFichier} alt="" className="signature-importee" />}
        {!pret && <span className="indice">{url ? 'Signe ici pour la remplacer' : 'Signe ici'}</span>}
        <div className="actions-pad">
          <button type="button" onClick={effacer} disabled={!pret}>Effacer</button>
          <label>Importer un PNG<input type="file" accept="image/png" hidden onChange={importer} /></label>
        </div>
      </div>

      {(erreur || envoyer.isError) && <p className="msg-erreur">{erreur || messageErreur(envoyer.error)}</p>}
      {envoyer.isSuccess && <p className="msg-ok">Signature enregistrée.</p>}

      <div className="pied-carte">
        <button type="button" className="btn-perso" disabled={!pret || envoyer.isPending} onClick={enregistrer}>
          {envoyer.isPending ? 'Enregistrement…' : 'Enregistrer la signature'}
        </button>
      </div>
    </section>
  )
}