import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useNonLus } from '../../api/fil'
import { useLirePlusieurs, useMarquerLue, useMarquerNonLue, useNotifications, useToutLire } from '../../api/notifications'
import useSession from '../../hooks/useSession'
import Dossiers from '../../components/notifications/Dossiers'
import LectureNotification from '../../components/notifications/LectureNotification'
import LigneNotification from '../../components/notifications/LigneNotification'
import { TYPES, groupeDe } from '../../components/notifications/types'
import '../../components/notifications/notifications.css'

const ETATS = [['toutes', 'Toutes'], ['non_lues', 'Non lues'], ['lues', 'Lues']]


export default function Notifications() {
  const { user } = useSession()
  const [params, setParams] = useSearchParams()
  const type = TYPES[params.get('type')] ? params.get('type') : ''
  const [etat, setEtat] = useState('toutes')
  const [saisie, setSaisie] = useState('')
  const [q, setQ] = useState('')
  const [choisie, setChoisie] = useState(null)
  const [coches, setCoches] = useState(() => new Set())
  const [nouvelles, setNouvelles] = useState(() => new Set())
  const [lit, setLit] = useState(false) 

  
  useEffect(() => {
    const t = setTimeout(() => setQ(saisie.trim()), 300)
    return () => clearTimeout(t)
  }, [saisie])

  const liste = useNotifications({ etat, type, q })
  const { notifications: nonLues } = useNonLus()
  const marquerLue = useMarquerLue()
  const marquerNonLue = useMarquerNonLue()
  const lirePlusieurs = useLirePlusieurs()
  const toutLire = useToutLire()

  const pages = liste.data?.pages ?? []
  const items = useMemo(() => pages.flatMap((p) => p.data), [pages])
  const parType = pages[0]?.par_type
  const total = pages[0]?.meta?.total ?? 0


  const ouverte = choisie ? items.find((n) => n.id === choisie.id) ?? choisie : null


  useEffect(() => {
    const arrivee = (e) => setNouvelles((s) => new Set(s).add(e.detail.id))
    addEventListener('jefnet:notification', arrivee)
    return () => removeEventListener('jefnet:notification', arrivee)
  }, [])


  const fin = useRef(null)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = liste
  useEffect(() => {
    const el = fin.current
    if (!el || !hasNextPage) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !isFetchingNextPage) fetchNextPage()
    }, { rootMargin: '200px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const changerType = (t) => {
    setParams(t ? { type: t } : {}, { replace: true })
    setCoches(new Set())
  }

  const ouvrir = (n) => {
    setChoisie(n)
    setLit(true)
    if (!n.est_lu) marquerLue.mutate(n.id)
    setNouvelles((s) => { if (!s.has(n.id)) return s; const c = new Set(s); c.delete(n.id); return c })
  }

  const basculer = () => {
    if (!ouverte) return
    ouverte.est_lu ? marquerNonLue.mutate(ouverte.id) : marquerLue.mutate(ouverte.id)
  }

  const cocher = (id, oui) => setCoches((s) => { const c = new Set(s); oui ? c.add(id) : c.delete(id); return c })
  const toutCoche = items.length > 0 && items.every((n) => coches.has(n.id))
  const lireSelection = () => {
    const ids = [...coches].filter((id) => items.find((n) => n.id === id && !n.est_lu))
    if (ids.length) lirePlusieurs.mutate(ids)
    setCoches(new Set())
  }

  const memeType = ouverte ? items.filter((x) => x.type === ouverte.type && x.id !== ouverte.id).slice(0, 4) : []
  const position = ouverte ? items.findIndex((x) => x.id === ouverte.id) + 1 : 0

  // les lignes, avec un titre à chaque nouveau jour
  let groupe = ''
  const lignes = items.map((n) => {
    const g = groupeDe(n.cree_le)
    const titre = g !== groupe ? <div key={`g-${g}`} className="jour-nt">{g}</div> : null
    groupe = g
    return [titre, (
      <LigneNotification key={n.id} n={n} choisie={ouverte?.id === n.id} cochee={coches.has(n.id)} nouvelle={nouvelles.has(n.id)}
        onOuvrir={() => ouvrir(n)} onCocher={(oui) => cocher(n.id, oui)} onLire={() => marquerLue.mutate(n.id)} />
    )]
  })

  return (
    <main className={`boite-nt ${lit ? 'lit' : ''}`}>
      <Dossiers type={type} setType={changerType} parType={parType} nonLues={nonLues}
        onToutLire={() => toutLire.mutate()} enCours={toutLire.isPending} />

      <section className="verre-nt liste-nt">
        <div className="barre-nt">
          <input type="search" value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="Rechercher dans les notifications" aria-label="Rechercher" />
        </div>
        <div className="filtres-nt">
          {ETATS.map(([v, l]) => (
            <button key={v} type="button" className={etat === v ? 'on' : ''} onClick={() => { setEtat(v); setCoches(new Set()) }}>{l}</button>
          ))}
        </div>
        <div className="groupe-nt">
          <input type="checkbox" checked={toutCoche} aria-label="Tout sélectionner"
            onChange={(e) => setCoches(new Set(e.target.checked ? items.map((n) => n.id) : []))} />
          <span>{coches.size ? `${coches.size} sélectionnée${coches.size > 1 ? 's' : ''}` : 'Sélectionner'}</span>
          {coches.size > 0 && <button type="button" onClick={lireSelection}>Marquer comme lu</button>}
        </div>

        {nouvelles.size > 0 && (
          <button type="button" className="toast-nt" onClick={() => { setNouvelles(new Set()); document.querySelector('.lignes-nt')?.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            {nouvelles.size} nouvelle{nouvelles.size > 1 ? 's' : ''} notification{nouvelles.size > 1 ? 's' : ''}<span>à l'instant</span>
          </button>
        )}

        <div className="lignes-nt">
          {liste.isPending ? [0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="sq-nt" />)
            : liste.isError ? <p className="vide-nt">Impossible de charger les notifications.</p>
              : items.length === 0 ? (
                <p className="vide-nt">
                  {q ? `Aucune notification ne contient « ${q} ».` : etat === 'non_lues' ? 'Tout est lu. Rien de nouveau pour le moment.' : 'Aucune notification ici.'}
                </p>
              ) : lignes}
          <div ref={fin} className="fin-nt">{liste.isFetchingNextPage && 'Chargement…'}</div>
        </div>
      </section>

      <LectureNotification n={ouverte} user={user} memeType={memeType} onOuvrir={ouvrir} onBasculer={basculer}
        onRetour={() => setLit(false)} position={position} total={total} />
    </main>
  )
}