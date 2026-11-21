import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useListePrestataires, useNombreCertifies } from '../../api/recherche'
import { useDomaines, usePhotosRealisations } from '../../api/visiteur'
import Avatar from '../../components/membre/Avatar'

const VILLES = ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Mbour', 'Touba', 'Diourbel', 'Kaolack', 'Saint-Louis',
  'Louga', 'Ziguinchor', 'Tambacounda', 'Kolda', 'Fatick', 'Kaffrine', 'Kédougou', 'Matam', 'Sédhiou']
const TRIS = [['note', 'Les mieux notés'], ['avis', "Plus d'avis"], ['prix', 'Moins chers']]
const virgule = (n) => Number(n).toFixed(1).replace('.', ',')
const prix = (n) => `${new Intl.NumberFormat('fr-FR').format(n).replace(/ | /g, ' ')} F`

function CartePresta({ p, rang, delai }) {
  const u = p.prestataire
  const m = u.membre ?? {}
  const { data: photos = [] } = usePhotosRealisations(p.id)
  const note = p.nombre_avis ? p.note_moyenne : 0
  return (
    <Link to={`/prestataires/${p.id}`} className={`carte-dom apparait ${rang <= 3 ? `r${rang}` : ''}`} style={{ animationDelay: `${delai}s` }}>
      <span className="rang">{rang}</span>
      <div className="photos-dom">
        {[0, 1].map((k) => <i key={k}>{photos[k] && <img src={photos[k]} alt="" loading="lazy" />}</i>)}
      </div>
      <div className="corps-dom">
        <Avatar nom={`${u.prenom} ${u.nom}`} photo={m.photo_url} couleur={m.couleur_perso} taille="a72" className="av-dom" />
        <b>{u.prenom} {u.nom}{p.est_certifie && <i className="certif">✓</i>}</b>
        <small>{[m.username && `@${m.username}`, p.titre_professionnel, [m.localite, m.ville].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}</small>
        <div className="note-dom">
          <span className="et">{'★★★★★'.slice(0, Math.round(note))}{'☆☆☆☆☆'.slice(0, 5 - Math.round(note))}</span>
          <b>{p.nombre_avis ? virgule(note) : 'Nouveau'}</b>
          <span className="jauge"><i style={{ width: `${(note / 5) * 100}%` }} /></span>
          <span className="nb">{p.nombre_avis ?? 0} avis</span>
        </div>
        <div className="bas-dom">
          <span>{p.prix_min != null ? <>À partir de <b>{prix(p.prix_min)}</b></> : ''}</span>
          <span className="voir">Voir le profil</span>
        </div>
      </div>
    </Link>
  )
}

// Liste des prestataires d'un domaine (/domaines/:id) ou d'une recherche (/recherche?q=…), du meilleur au moins bien noté
export default function ListePrestataires() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const q = id ? '' : (params.get('q') ?? '')
  const [tri, setTri] = useState('note')
  const [certifie, setCertifie] = useState(false)
  const [ville, setVille] = useState('')
  const { data: domaines = [] } = useDomaines()
  const domaine = domaines.find((d) => String(d.id) === String(id))
  const liste = useListePrestataires({ domaine: id, q, tri, certifie, ville })
  const certifies = useNombreCertifies(id)
  const pros = liste.data?.pages.flatMap((p) => p.data) ?? []
  const total = liste.data?.pages[0]?.meta.total

  const bas = useRef(null)
  useEffect(() => {
    const el = bas.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && liste.hasNextPage && !liste.isFetchingNextPage) liste.fetchNextPage() }, { rootMargin: '500px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [liste])

  useEffect(() => { window.scrollTo(0, 0) }, [id, q])

  const titre = id ? (domaine?.libelle ?? 'Domaine') : `Résultats pour « ${q} »`
  const meilleur = pros.find((p) => p.nombre_avis)

  return (
    <main className="page-dom">
      <section className="banniere-dom apparait" style={domaine?.image_url ? { '--img': `url(${domaine.image_url})` } : undefined}>
        <span className="fil-ariane"><Link to="/fil">Fil</Link> › {id ? 'Domaines' : 'Recherche'} › {id ? (domaine?.libelle ?? '…') : q}</span>
        <h1>{titre}</h1>
        {domaine?.description && <p>{domaine.description}</p>}
        <div className="chiffres-dom">
          <div><b>{total ?? '–'}</b><span>prestataire{total > 1 ? 's' : ''}</span></div>
          {meilleur && tri === 'note' && <div><b>{virgule(meilleur.note_moyenne)} ★</b><span>meilleure note</span></div>}
          {id && <div><b>{certifies.data ?? '–'}</b><span>certifiés</span></div>}
        </div>
      </section>

      <div className="barre-dom">
        <div className="tri-dom">
          {TRIS.map(([cle, libelle]) => <button key={cle} type="button" className={tri === cle ? 'on' : ''} onClick={() => setTri(cle)}>{libelle}</button>)}
        </div>
        <button type="button" className={`puce-dom ${certifie ? 'on' : ''}`} onClick={() => setCertifie((c) => !c)}>✓ Certifiés</button>
        <select className="puce-dom" value={ville} onChange={(e) => setVille(e.target.value)} aria-label="Ville">
          <option value="">📍 Toutes les villes</option>
          {VILLES.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        {total != null && <span className="total-dom">{total} prestataire{total > 1 ? 's' : ''}{tri === 'note' ? ' · du meilleur au moins bien noté' : ''}</span>}
      </div>

      <div className="liste-dom">
        {liste.isPending && Array.from({ length: 6 }, (_, k) => <div key={k} className="carte-dom sq" style={{ height: 300 }} />)}
        {pros.map((p, i) => <CartePresta key={p.id} p={p} rang={i + 1} delai={Math.min(i % 12, 6) * 0.05} />)}
      </div>
      {liste.isSuccess && !pros.length && (
        <div className="bloc vide-fil"><b>Aucun prestataire trouvé</b>Essaie d'enlever un filtre ou de changer de ville.</div>
      )}
      <div ref={bas} />
      {liste.isFetchingNextPage && <p className="fin-fil">Chargement…</p>}
    </main>
  )
}