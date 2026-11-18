import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ACCUEIL, INCOMPRIS, SUGGESTIONS, trouverReponse } from '../../lib/assistant'
import Vagues from './Vagues'
import './assistant.css'

// JefIA : bouton à vagues en bas à droite + fenêtre de questions / réponses
export default function Assistant() {
  const naviguer = useNavigate()
  const [ouvert, setOuvert] = useState(false)
  const [dejaOuvert, setDejaOuvert] = useState(false)
  const [messages, setMessages] = useState([{ de: 'jefia', texte: ACCUEIL, suggestions: SUGGESTIONS }])
  const [saisie, setSaisie] = useState('')
  const [ecrit, setEcrit] = useState(false)
  const fil = useRef(null)
  const champ = useRef(null)

  // descendre en bas du fil à chaque nouveau message
  useEffect(() => {
    fil.current?.scrollTo({ top: fil.current.scrollHeight, behavior: 'smooth' })
  }, [messages, ecrit])

  // d'autres parties du site peuvent ouvrir JefIA (ex. le bouton de la FAQ)
  useEffect(() => {
    const ouvrirDepuisLaPage = () => { setOuvert(true); setDejaOuvert(true) }
    window.addEventListener('jefia:ouvrir', ouvrirDepuisLaPage)
    return () => window.removeEventListener('jefia:ouvrir', ouvrirDepuisLaPage)
  }, [])

  // Échap ferme la fenêtre
  useEffect(() => {
    if (!ouvert) return
    champ.current?.focus()
    const touche = (e) => e.key === 'Escape' && setOuvert(false)
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [ouvert])

  const ouvrir = () => { setOuvert(!ouvert); setDejaOuvert(true) }

  const demander = (texte) => {
    const question = texte.trim()
    if (!question || ecrit) return
    setSaisie('')
    setMessages((m) => [...m, { de: 'moi', texte: question }])
    setEcrit(true)
    const trouvee = trouverReponse(question)
    setTimeout(() => {
      setMessages((m) => [...m, trouvee
        ? { de: 'jefia', texte: trouvee.reponse, action: trouvee.action, suggestions: trouvee.suggestions ? SUGGESTIONS : undefined }
        : { de: 'jefia', texte: INCOMPRIS, suggestions: SUGGESTIONS }])
      setEcrit(false)
    }, 800)
  }

  // bouton d'action : une section de l'accueil (/#trouver) ou une autre page (/connexion)
  const allerA = (vers) => {
    setOuvert(false)
    if (vers.startsWith('/#')) {
      naviguer(vers, { preventScrollReset: true })
      setTimeout(() => document.getElementById(vers.slice(2))?.scrollIntoView({ behavior: 'smooth' }), 50)
    } else {
      naviguer(vers)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
      {ouvert && (
        <section role="dialog" aria-label="JefIA, l'assistant JefNet"
          className="fenetre-jefia flex h-[min(560px,calc(100vh-140px))] w-[min(380px,calc(100vw-40px))] flex-col overflow-hidden rounded-[28px]">
          {/* en-tête */}
          <header className="flex items-center gap-3 bg-[linear-gradient(110deg,#0174ab,#1a8fd0_60%,#38b4ea)] px-4 py-3.5 text-white dark:bg-[linear-gradient(110deg,#03314f,#0a4f7e_60%,#0174ab)]">
            <Vagues taille={42} />
            <div>
              <p className="font-bold">JefIA</p>
              <p className="flex items-center gap-1.5 text-xs text-white/85">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> En ligne · répond tout de suite
              </p>
            </div>
            <button type="button" onClick={() => setOuvert(false)} aria-label="Fermer"
              className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-white/20 transition hover:bg-white/30">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </header>

          {/* messages */}
          <div ref={fil} className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`message-jefia flex flex-col gap-2 ${m.de === 'moi' ? 'items-end' : 'items-start'}`}>
                <p className={`max-w-[85%] rounded-[18px] px-3.5 py-2.5 text-sm leading-relaxed ${m.de === 'moi'
                  ? 'rounded-br-md bg-[#0174ab] text-white'
                  : 'rounded-bl-md border border-[#e3eef6] bg-white text-slate-800 shadow-[0_4px_14px_-10px_rgba(1,80,130,.4)] dark:border-white/10 dark:bg-white/10 dark:text-slate-100'}`}>
                  {m.texte}
                  {m.action && (
                    <button type="button" onClick={() => allerA(m.action.vers)}
                      className="mt-2 block rounded-full bg-[#0174ab] px-3.5 py-1.5 text-[13px] font-bold text-white transition hover:bg-[#015d8a]">
                      {m.action.libelle} →
                    </button>
                  )}
                </p>
                {m.suggestions && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.suggestions.map((s) => (
                      <button key={s} type="button" onClick={() => demander(s)}
                        className="rounded-full border border-[#cfe5f4] bg-[#e3f1fa] px-3 py-1.5 text-left text-[12.5px] font-semibold text-[#0174ab] transition hover:bg-[#d3eafa] dark:border-white/10 dark:bg-white/10 dark:text-[#7dd3fc]">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {ecrit && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Vagues taille={26} /> JefIA écrit…
              </div>
            )}
          </div>

          {/* saisie */}
          <form onSubmit={(e) => { e.preventDefault(); demander(saisie) }}
            className="flex gap-2 border-t border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
            <input ref={champ} value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="Écrivez votre question…"
              className="min-w-0 flex-1 rounded-full bg-[#f1f6fa] px-4 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#38b4ea]/50 dark:bg-white/10 dark:text-white" />
            <button type="submit" aria-label="Envoyer" disabled={!saisie.trim() || ecrit}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0174ab] text-white transition hover:bg-[#015d8a] disabled:opacity-40">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M3 20l18-8L3 4v6l12 2-12 2z" /></svg>
            </button>
          </form>
        </section>
      )}

      <div className="flex items-center gap-3">
        {!dejaOuvert && !ouvert && (
          <span className="hidden rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_10px_30px_-14px_rgba(1,80,130,.5)] sm:block dark:bg-[#0b1a2e] dark:text-white">
            Une question ? JefIA vous aide
          </span>
        )}
        <button type="button" onClick={ouvrir} aria-expanded={ouvert}
          aria-label={ouvert ? 'Fermer JefIA' : 'Ouvrir JefIA, l’assistant'} className="rounded-full transition hover:scale-105">
          <Vagues taille={64} className="vagues-lanceur" />
        </button>
      </div>
    </div>
  )
}