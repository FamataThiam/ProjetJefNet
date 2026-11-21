import { useState } from 'react'
import { Link } from 'react-router-dom'
import { medias as triees } from '../profil/format'
import Avatar from '../membre/Avatar'
import Commentaires from './Commentaires'

const LONGUEUR = 220
const IC = {
  commenter: <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z" />,
  partager: <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" />,
  reserver: <><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
}
const Ic = ({ n }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{IC[n]}</svg>

// Une publication du fil (réalisation d'un prestataire)
export default function Publication({ pub, onOuvrirMedia, style }) {
  const [deplie, setDeplie] = useState(false)
  const [copie, setCopie] = useState(false)
  const [ouvert, setOuvert] = useState(false)   // zone des commentaires dépliée ?
  const [chargee, setChargee] = useState(false) // déjà ouverte une fois (on la garde en mémoire)
  const [nb, setNb] = useState(pub.nb_commentaires)
  const basculer = () => { setOuvert((o) => !o); setChargee(true) }
  const p = pub.prestataire
  const liste = triees(pub)
  const visibles = liste.slice(0, 3)
  const avantApres = liste.length >= 2 && /avant|apr[eè]s/i.test(pub.titre)
  const lienProfil = `/prestataires/${p.uuid}`
  const texte = pub.description ?? ''
  const long = texte.length > LONGUEUR

  const partager = async () => {
    const lien = `${window.location.origin}${lienProfil}`
    try {
      if (navigator.share) await navigator.share({ title: pub.titre, text: `${p.nom} sur JefNet`, url: lien })
      else { await navigator.clipboard.writeText(lien); setCopie(true); setTimeout(() => setCopie(false), 2000) }
    } catch { /* partage annulé */ }
  }

  return (
    <article className="bloc post apparait" style={style}>
      <div className="post-tete">
        <Link to={lienProfil}><Avatar nom={p.nom} photo={p.photo_url} taille="a48" /></Link>
        <div style={{ minWidth: 0 }}>
          <Link to={lienProfil} className="nom">{p.nom}{p.certifie && <i className="certif" title="Certifié JefNet">✓</i>}</Link>
          <small>{[p.titre, [p.localite, p.ville].filter(Boolean).join(', '), pub.il_y_a].filter(Boolean).join(' · ')}</small>
        </div>
        {!pub.est_auteur && <Link to={lienProfil} className="voir-profil">Voir le profil</Link>}
      </div>

      <div className="post-texte">
        <b>{pub.titre}</b>
        {long && !deplie ? <>{texte.slice(0, LONGUEUR).trimEnd()}… <button type="button" className="voir-plus" onClick={() => setDeplie(true)}>voir plus</button></> : texte}
      </div>

      {visibles.length > 0 && (
        <div className={`medias-fil m${visibles.length}`}>
          {visibles.map((m, k) => (
            <button key={m.id} type="button" className="ph" onClick={() => onOuvrirMedia(pub, k)} aria-label="Voir en grand">
              {m.type === 'VIDEO' ? <video src={m.url} muted playsInline preload="metadata" /> : <img src={m.url} alt="" loading="lazy" />}
              {avantApres && k < 2 && <span className="etiq">{k === 0 ? 'AVANT' : 'APRÈS'}</span>}
              {k === 2 && liste.length > 3 && <span className="encore">+{liste.length - 3}</span>}
            </button>
          ))}
        </div>
      )}

      <div className="compteurs">
        <span>{liste.length > 0 ? `${liste.length} ${liste.some((m) => m.type === 'VIDEO') ? 'média' : 'photo'}${liste.length > 1 ? 's' : ''}` : ''}</span>
        <button type="button" className="voir-plus" onClick={basculer}>{nb} commentaire{nb > 1 ? 's' : ''}</button>
      </div>
      <div className="post-actions">
        <button type="button" onClick={basculer} className={ouvert ? 'actif' : ''} aria-expanded={ouvert}><Ic n="commenter" />Commenter</button>
        <button type="button" onClick={partager} className={copie ? 'copie' : ''}><Ic n="partager" />{copie ? 'Lien copié' : 'Partager'}</button>
        {!pub.est_auteur && (pub.deja_reserve
          ? <Link to={`${lienProfil}#reserver`} className="deja"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 13l4 4L19 7" /></svg>Déjà réservé</Link>
          : <Link to={`${lienProfil}#reserver`} className="reserver"><Ic n="reserver" />Réserver</Link>)}
      </div>

      {/* commentaires : on clique sur « Commenter » pour ouvrir, on reclique pour replier */}
      <div className={`tiroir-com ${ouvert ? 'ouvert' : ''}`}>
        <div>{chargee && <Commentaires pub={pub} total={nb} onChangementTotal={(n) => setNb((v) => Math.max(0, v + n))} />}</div>
      </div>
    </article>
  )
}