import { useEffect, useRef, useState } from 'react'


export default function PadSignature({ onChange }) {
  const toile = useRef(null)
  const dessin = useRef(false)
  const vide = useRef(true)
  const [aSigne, setASigne] = useState(false)

  useEffect(() => {
    const c = toile.current
    const r = c.getBoundingClientRect()
    c.width = r.width * devicePixelRatio
    c.height = r.height * devicePixelRatio
    const ctx = c.getContext('2d')
    ctx.scale(devicePixelRatio, devicePixelRatio)
    Object.assign(ctx, { lineWidth: 2.6, lineCap: 'round', lineJoin: 'round', strokeStyle: '#0b1b33' })
  }, [])

  const point = (e) => {
    const r = toile.current.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }
  const commencer = (e) => {
    e.preventDefault()
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
    vide.current = false
  }
  const arreter = () => {
    if (!dessin.current) return
    dessin.current = false
    if (!vide.current) { setASigne(true); onChange(toile.current.toDataURL('image/png')) }
  }
  const effacer = () => {
    const c = toile.current
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
    vide.current = true
    setASigne(false)
    onChange(null)
  }

  return (
    <div className="rs-pad">
      <canvas ref={toile} onPointerDown={commencer} onPointerMove={tracer} onPointerUp={arreter} onPointerLeave={arreter} />
      <span className="indice" style={{ opacity: aSigne ? 0 : 1 }}>Signe ici</span>
      <button type="button" className="rs-btn contour petit" onClick={effacer}>Effacer</button>
    </div>
  )
}