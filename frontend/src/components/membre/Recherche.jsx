import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useRechercheRapide } from '../../api/recherche'
import { useDomaines } from '../../api/visiteur'
import Avatar from './Avatar'

const VILLES = ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Mbour', 'Touba', 'Diourbel', 'Kaolack', 'Saint-Louis',
  'Louga', 'Ziguinchor', 'Tambacounda', 'Kolda', 'Fatick', 'Kaffrine', 'Kédougou', 'Matam', 'Sédhiou']
const sans = (t = '') => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// met en bleu la partie du texte qui correspond à la recherche
function Surligne({ texte = '', motif }) {
  const m = sans(motif.replace(/^@/, '').trim())
  if (!m) return texte
  const i = sans(texte).indexOf(m)
  if (i < 0) return texte
  return <>{texte.slice(0, i)}<mark>{texte.slice(i, i + m.length)}</mark>{texte.slice(i + m.length)}</>
}

// texte qui « attend » un peu avant de lancer la recherche (on ne cherche pas à chaque lettre)
function useRetarde(valeur, ms = 250) {
  const [v, setV] = useState(valeur)
  useEffect(() => { const t = setTimeout(() => setV(valeur), ms); return () => clearTimeout(t) }, [valeur, ms])
  return v
}

// Popup de recherche : saisie devinée + domaines + prestataires
export default function Recherche({ onFermer }) {
  const [texte, setTexte] = useState('')
  const [choix, setChoix] = useState(0)
  const champ = useRef(null)
  const navigate = useNavigate()
  const retarde = useRetarde(texte)
  const { data: domaines = [] } = useDomaines()
  const recherche = useRechercheRapide(retarde)
  const prestataires = texte.trim().length >= 2 ? (recherche.data?.data ?? []).slice(0, 5) : []
  const total = recherche.data?.meta?.total ?? 0
  const t = sans(texte.trim())

  // mots proposés (comme Google) : domaines, métiers des résultats, villes
  const mots = useMemo(() => {
    if (!t) return []
    const sources = [
      ...domaines.map((d) => d.libelle),
      ...(recherche.data?.data ?? []).map((p) => p.titre_professionnel),
      ...VILLES,
    ].filter(Boolean)
    const uniques = [...new Map(sources.map((m) => [sans(m), m])).values()]
    return uniques.filter((m) => sans(m).startsWith(t) && sans(m) !== t).slice(0, 3)
  }, [t, domaines, recherche.data])

  const domainesTrouves = useMemo(() => (t
    ? domaines.filter((d) => sans(d.libelle).includes(t) || sans(d.description ?? '').includes(t)).slice(0, 3)
    : domaines.filter((d) => d.nombre_prestataires > 0).slice(0, 6)), [t, domaines])

  const devine = mots[0] && sans(mots[0]).startsWith(t) ? mots[0].slice(texte.trim().length) : ''

  // tout ce qu'on peut choisir au clavier, dans l'ordre d'affichage
  const elements = [
    ...mots.map((m) => ({ type: 'mot', m })),
    ...domainesTrouves.map((d) => ({ type: 'domaine', d })),
    ...prestataires.map((p) => ({ type: 'presta', p })),
    ...(t.length >= 2 ? [{ type: 'tout' }] : []),
  ]

  useEffect(() => { champ.current?.focus(); document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])
  useEffect(() => { setChoix(0) }, [texte])

  const ouvrir = (e) => {
    if (!e) return
    if (e.type === 'mot') { setTexte(e.m); champ.current?.focus(); return }
    onFermer()
    if (e.type === 'domaine') navigate(`/domaines/${e.d.id}`)
    if (e.type === 'presta') navigate(`/prestataires/${e.p.id}`)
    if (e.type === 'tout') navigate(`/recherche?q=${encodeURIComponent(texte.trim())}`)
  }

  const touche = (e) => {
    if (e.key === 'Escape') onFermer()
    else if (e.key === 'ArrowDown') { e.preventDefault(); setChoix((c) => Math.min(c + 1, elements.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setChoix((c) => Math.max(c - 1, 0)) }
    else if ((e.key === 'Tab' || (e.key === 'ArrowRight' && e.target.selectionStart === texte.length)) && devine) { e.preventDefault(); setTexte(texte.trim() + devine) }
    else if (e.key === 'Enter') { e.preventDefault(); elements[choix] ? ouvrir(elements[choix]) : t.length >= 2 && ouvrir({ type: 'tout' }) }
  }

  let index = -1
  const classe = () => { index += 1; return index === choix ? 'on' : '' }
  const conteneur = document.querySelector('.mb') ?? document.body

  return createPortal(
    <>
      <div className="voile-r" onClick={onFermer} />
      <div className="palette" role="dialog" aria-label="Rechercher">
        <div className="champ-r">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <div className="saisie">
            <span className="fantome" aria-hidden="true"><span>{texte}</span>{devine}</span>
            <input ref={champ} value={texte} onChange={(e) => setTexte(e.target.value)} onKeyDown={touche}
              placeholder="Nom, @username, métier, ville…" autoComplete="off" spellCheck={false} />
          </div>
          {recherche.isFetching && <span className="tourne-r" />}
          {devine && <span className="tab-cle">Tab ⇥</span>}
          <button type="button" className="echap" onClick={onFermer}>Échap</button>
        </div>

        <div className="corps-r">
          {mots.length > 0 && (
            <div className="sugg">
              {mots.map((m) => (
                <button key={m} type="button" className={classe()} onClick={() => ouvrir({ type: 'mot', m })}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
                  <span><b>{m.slice(0, texte.trim().length)}</b>{m.slice(texte.trim().length)}</span>
                </button>
              ))}
            </div>
          )}

          {domainesTrouves.length > 0 && (
            <>
              <div className="rubrique"><span>{t ? 'Domaines' : 'Parcourir les domaines'}</span></div>
              <div className="resultats">
                {domainesTrouves.map((d) => (
                  <button key={d.id} type="button" className={`res ${classe()}`} onClick={() => ouvrir({ type: 'domaine', d })}>
                    <span className="dom-ic" style={d.image_url ? { backgroundImage: `url(${d.image_url})` } : undefined} />
                    <span className="txt"><b><span><Surligne texte={d.libelle} motif={texte} /></span></b>{d.description && <small>{d.description}</small>}</span>
                    <span className="nb-p">{d.nombre_prestataires} prestataire{d.nombre_prestataires > 1 ? 's' : ''} →</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {t.length >= 2 && (
            <>
              <div className="rubrique"><span>Prestataires</span>{total > 0 && <span>{total} résultat{total > 1 ? 's' : ''}</span>}</div>
              <div className="resultats">
                {recherche.isPending && <p className="vide-r">Recherche…</p>}
                {!recherche.isPending && !prestataires.length && <p className="vide-r">Aucun prestataire pour « {texte.trim()} ».</p>}
                {prestataires.map((p) => {
                  const u = p.prestataire
                  const m = u.membre ?? {}
                  return (
                    <button key={p.id} type="button" className={`res ${classe()}`} onClick={() => ouvrir({ type: 'presta', p })}>
                      <Avatar nom={`${u.prenom} ${u.nom}`} photo={m.photo_url} couleur={m.couleur_perso} taille="a44" />
                      <span className="txt">
                        <b><span><Surligne texte={`${u.prenom} ${u.nom}`} motif={texte} /></span>{p.est_certifie && <i className="certif">✓</i>}</b>
                        <small>
                          {m.username && <>@<Surligne texte={m.username} motif={texte} /> · </>}
                          <Surligne texte={p.titre_professionnel} motif={texte} />
                          {m.ville && <> · <Surligne texte={[m.localite, m.ville].filter(Boolean).join(', ')} motif={texte} /></>}
                        </small>
                      </span>
                      <span className="droite">{p.nombre_avis ? <>★ {Number(p.note_moyenne).toFixed(1).replace('.', ',')}<small>{p.nombre_avis} avis</small></> : <>Nouveau<small>0 avis</small></>}</span>
                    </button>
                  )
                })}
                {total > 0 && (
                  <button type="button" className={`tous-r ${classe()}`} onClick={() => ouvrir({ type: 'tout' })}>
                    Voir les {total} résultats pour « {texte.trim()} » →
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="pied-r">
          <span><b className="tab-cle">↑↓</b> naviguer</span><span><b className="tab-cle">↵</b> ouvrir</span><span><b className="tab-cle">Tab</b> compléter</span>
          <span className="droite-p">Nom, @username, métier, domaine ou ville</span>
        </div>
      </div>
    </>,
    conteneur,
  )
}