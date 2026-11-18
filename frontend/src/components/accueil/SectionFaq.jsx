import { useState } from 'react'
import { Link } from 'react-router-dom'
import { QUESTIONS } from '../../lib/assistant'
import Vagues from '../assistant/Vagues'


const FAQ = QUESTIONS.filter((q) => !q.politesse)
const LIEN = 'mt-3 inline-block text-sm font-bold text-[#0174ab] hover:underline dark:text-[#7dd3fc]'


export default function SectionFaq() {
  const [ouverte, setOuverte] = useState(0)

  return (
    <section id="faq" className="mx-auto grid max-w-7xl scroll-mt-24 items-start gap-12 px-5 py-20 sm:px-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
      <div className="lg:sticky lg:top-28">
        <p className="text-[13px] font-bold uppercase tracking-[.16em] text-[#0174ab] dark:text-[#38bdf8]">Aide</p>
        <h2 className="mt-2 text-3xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-[44px] dark:text-white">
          Questions<br />fréquentes
        </h2>
        <p className="mt-4 text-[17px] leading-relaxed text-slate-500 dark:text-slate-400">
          Tout ce qu'il faut savoir avant de réserver ou de proposer vos services.
        </p>

        {/* JefIA */}
        <div className="relative mt-8 flex flex-wrap items-center gap-4 overflow-hidden rounded-[26px] bg-[linear-gradient(110deg,#0174ab,#1a8fd0_60%,#38b4ea)] p-5 text-white shadow-[0_24px_50px_-28px_rgba(1,116,171,.8)] dark:bg-[linear-gradient(110deg,#03314f,#0a4f7e_60%,#0174ab)]">
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(200px_80px_at_20%_0%,rgba(255,255,255,.35),transparent_70%)]" />
          <Vagues taille={56} />
          <span className="relative">
            <b className="block text-lg">Une autre question ?</b>
            <small className="text-sm text-white/90">JefIA vous répond tout de suite.</small>
          </span>
          <button type="button" onClick={() => window.dispatchEvent(new Event('jefia:ouvrir'))}
            className="relative ml-auto rounded-full bg-white px-5 py-2.5 font-bold text-[#0174ab] transition hover:-translate-y-0.5">
            Demander à JefIA
          </button>
        </div>
      </div>

      {/* accordéon : une seule réponse ouverte à la fois */}
      <div className="flex flex-col gap-3">
        {FAQ.map((q, i) => {
          const ouvert = ouverte === i
          return (
            <div key={q.question}
              className={`rounded-[20px] border bg-white/90 backdrop-blur-xl transition dark:bg-white/5 ${ouvert
                ? 'border-[#bfe0f3] shadow-[0_0_0_3px_rgba(56,180,234,.15),0_18px_40px_-26px_rgba(1,80,130,.6)] dark:border-[#38bdf8]/40'
                : 'border-white shadow-[0_14px_34px_-26px_rgba(1,80,130,.5)] dark:border-white/10'}`}>
              <button type="button" onClick={() => setOuverte(ouvert ? -1 : i)} aria-expanded={ouvert}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-[16.5px] font-bold text-slate-900 dark:text-white">
                {q.question}
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg font-extrabold transition ${ouvert
                  ? 'rotate-180 bg-[#0174ab] text-white'
                  : 'bg-[#e3f1fa] text-[#0174ab] dark:bg-white/10 dark:text-[#7dd3fc]'}`}>
                  {ouvert ? '−' : '+'}
                </span>
              </button>
              {/* la réponse se déplie en douceur */}
              <div className={`grid transition-[grid-template-rows] duration-300 ${ouvert ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <div className="px-6 pb-5">
                    <p className="leading-relaxed text-slate-600 dark:text-slate-400">{q.reponse}</p>
                    {q.action && (q.action.vers.startsWith('/#')
                      // lien vers une section de l'accueil : simple ancre
                      ? <a href={q.action.vers} className={LIEN}>{q.action.libelle} →</a>
                      : <Link to={q.action.vers} className={LIEN}>{q.action.libelle} →</Link>)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}