import { useEffect, useRef, useState } from 'react'
import { etoiles } from './OngletsProfil'
import { dateLongue, virgule, zone } from './format'

// Les barres se remplissent quand le bloc arrive à l'écran
function useVisible() {
  const ref = useRef(null)
  const [vu, setVu] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVu(true); obs.disconnect() } }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, vu]
}

// Colonne de droite : note et répartition des avis, dernier avis, informations
export default function ColonneProfil({ profil, avis }) {
  const [ref, vu] = useVisible()
  const premiere = avis.data?.pages[0]
  const stats = premiere?.statistiques
  const dernier = premiere?.data?.[0]
  const total = stats?.total ?? profil.nombre_avis
  const moyenne = stats?.moyenne ?? profil.note_moyenne

  const lignes = [
    ['Métier', profil.titre_professionnel],
    ['Domaine', profil.domaines?.join(', ')],
    ['Expérience', profil.experience],
    ['Zone', zone(profil.rayon_intervention)],
    ['Paiement', 'Wave, OM, carte'],
  ].filter(([, v]) => v)

  return (
    <aside className="flex flex-col gap-3.5 lg:sticky lg:top-24 lg:self-start">
      <div ref={ref} className="verre-profil rounded-3xl p-5">
        <h3 className="titre-bloc">Avis des clients</h3>
        {total ? (
          <>
            <div className="flex items-center gap-3">
              <b className="bg-gradient-to-br from-[#0174ab] to-[#38b4ea] bg-clip-text text-[44px] font-black tracking-tight text-transparent">{virgule(moyenne)}</b>
              <div>
                <div className="tracking-[2px] text-[#f5b301]">{etoiles(Math.round(moyenne))}</div>
                <small className="text-[12.5px] text-slate-500 dark:text-slate-400">{total} avis vérifiés</small>
              </div>
            </div>
            {stats && [5, 4, 3, 2, 1].map((n) => {
              const c = stats.repartition?.[n] ?? 0
              return (
                <div key={n} className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="w-5">{n}★</span>
                  <i className="barre-note"><b style={{ width: vu ? `${(c / stats.total) * 100}%` : 0 }} /></i>
                  <span className="w-7 text-right">{c}</span>
                </div>
              )
            })}
            {dernier?.commentaire && (
              <div className="mt-3.5 border-t border-[#0174ab]/15 pt-3.5 text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                « {dernier.commentaire} »
                <small className="mt-1 block text-slate-500 dark:text-slate-400">{dernier.auteur} · {etoiles(dernier.note)} · {dateLongue(dernier.date)}</small>
              </div>
            )}
          </>
        ) : <p className="text-sm text-slate-500">Pas encore d'avis.</p>}
      </div>

      <div className="verre-profil rounded-3xl p-5">
        <h3 className="titre-bloc">Informations</h3>
        {lignes.map(([l, v]) => (
          <div key={l} className="flex justify-between gap-4 border-b border-[#0174ab]/10 py-2 text-[13.5px] last:border-0">
            <span className="text-slate-500 dark:text-slate-400">{l}</span><b className="text-right text-slate-900 dark:text-white">{v}</b>
          </div>
        ))}
        {(profil.linkedin || profil.portfolio) && (
          <div className="mt-3 flex gap-2">
            {[['LinkedIn', profil.linkedin], ['Portfolio', profil.portfolio]].filter(([, u]) => u).map(([l, u]) => (
              <a key={l} href={u} target="_blank" rel="noreferrer"
                className="flex-1 rounded-xl bg-[#e3f1fa] py-2.5 text-center text-[13px] font-bold text-[#0174ab] transition hover:bg-[#d3eafa] dark:bg-white/10 dark:text-[#7dd3fc]">{l}</a>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}