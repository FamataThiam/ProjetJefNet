import { useState } from 'react'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(n)).replace(/[\u202f\u00a0]/g, ' ')
const court = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} M` : n >= 1000 ? `${Math.round(n / 1000)}k` : `${Math.round(n)}`)


function plafond(max) {
  if (max <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(max))
  return [1, 2, 2.5, 5, 10].map((k) => k * p).find((v) => v >= max)
}


export function MiniCourbe({ serie = [] }) {
  if (serie.length < 2 || serie.every((v) => !v)) return null
  const max = Math.max(...serie, 1)
  const pts = serie.map((v, i) => `${(i / (serie.length - 1)) * 120},${30 - (v / max) * 26}`).join(' ')
  return (
    <svg className="ep-mini" viewBox="0 0 120 34" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="var(--perso)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}


export function Evolution({ mois = [] }) {
  const [survol, setSurvol] = useState(null)
  const L = 640, H = 210, G = 46, B = 30, Hh = 16
  const larg = (L - G) / Math.max(mois.length, 1)
  const maxCa = plafond(Math.max(...mois.map((m) => m.chiffre_affaires), 0))
  const maxPr = Math.max(...mois.map((m) => m.prestations), 1)
  const y = (v) => H - B - (v / maxCa) * (H - B - Hh)
  const x = (i) => G + larg * i + larg / 2
  const ligne = mois.map((m, i) => `${x(i)},${y(m.chiffre_affaires)}`).join(' ')
  const m = survol !== null ? mois[survol] : null

  return (
    <div className="ep-evolution">
      <svg viewBox={`0 0 ${L} ${H}`} role="img" aria-label="Chiffre d'affaires et prestations par mois" onMouseLeave={() => setSurvol(null)}>
        {[0, 0.25, 0.5, 0.75, 1].map((k) => (
          <g key={k}>
            <line x1={G} x2={L} y1={y(maxCa * k)} y2={y(maxCa * k)} className="ep-grille" />
            <text x={G - 8} y={y(maxCa * k) + 4} textAnchor="end" className="ep-axe">{court(maxCa * k)}</text>
          </g>
        ))}
        {mois.map((mo, i) => {
          const h = (mo.prestations / maxPr) * (H - B - Hh) * 0.55
          return (
            <g key={mo.mois} onMouseEnter={() => setSurvol(i)}>
              <rect x={G + larg * i} y={Hh} width={larg} height={H - B - Hh} fill="transparent" />
              <rect x={x(i) - Math.min(11, larg / 3)} y={H - B - h} width={Math.min(22, larg / 1.5)} height={Math.max(h, 0)} rx="4" className={`ep-barre ${survol === i ? 'on' : ''}`} />
              {(i % 2 === (mois.length - 1) % 2) && <text x={x(i)} y={H - 10} textAnchor="middle" className="ep-axe">{mo.libelle.split(' ')[0]}</text>}
            </g>
          )
        })}
        <polyline points={ligne} fill="none" stroke="var(--perso)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
        {mois.length > 0 && <circle cx={x(mois.length - 1)} cy={y(mois.at(-1).chiffre_affaires)} r="5" className="ep-point" />}
        {m && <circle cx={x(survol)} cy={y(m.chiffre_affaires)} r="5" className="ep-point" />}
      </svg>
      {m && (
        <div className="ep-bulle" style={{ left: `${(x(survol) / L) * 100}%` }}>
          <b>{m.libelle}</b>
          <span>{fmt(m.chiffre_affaires)} F</span>
          <span>{m.prestations} prestation{m.prestations > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  )
}


const H_DEBUT = 7, H_FIN = 22
export function Chaleur({ lignes = [] }) {
  const max = Math.max(1, ...lignes.flatMap((l) => l.heures.slice(H_DEBUT, H_FIN)))
  const heures = Array.from({ length: H_FIN - H_DEBUT }, (_, i) => H_DEBUT + i)
  return (
    <div className="ep-chaleur" style={{ gridTemplateColumns: `34px repeat(${heures.length},1fr)` }}>
      <span />
      {heures.map((h) => <span key={h} className="ep-h">{h % 3 === 2 ? `${h}h` : ''}</span>)}
      {lignes.map((l) => (
        <div key={l.jour} style={{ display: 'contents' }}>
          <span className="ep-j">{l.jour}</span>
          {heures.map((h) => {
            const v = l.heures[h] ?? 0
            return <span key={h} className="ep-case" title={`${l.jour} ${h}h : ${v} réservation${v > 1 ? 's' : ''}`}
              style={{ background: v ? `color-mix(in srgb,var(--perso) ${Math.round(18 + (v / max) * 82)}%,transparent)` : undefined }} />
          })}
        </div>
      ))}
    </div>
  )
}