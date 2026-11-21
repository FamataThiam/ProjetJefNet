import Coches from './Coches'
import LecteurVocal from './LecteurVocal'
import { IconeCamera } from './AppelEntrant'

const extension = (nom = '') => (nom.split('.').pop() || 'FICHIER').slice(0, 4).toUpperCase()


export default function Bulle({ m, suite, interlocuteur, onRepondre, onCitation }) {

  if (m.type === 'APPEL_VIDEO') {
    const manque = /manqu/i.test(m.contenu ?? '')
    return (
      <div className={`trace-appel ${manque ? 'manque' : ''}`} id={`m-${m.id}`}>
        <span className="rond"><IconeCamera /></span>
        <div><b>{m.contenu ?? 'Appel vidéo'}</b><small>{m.est_moi ? 'Appel sortant' : 'Appel entrant'} · {m.heure}</small></div>
      </div>
    )
  }

  const meta = <span className="meta">{m.heure}{m.est_moi && <Coches m={m} />}</span>
  const f = m.fichier

  return (
    <div id={`m-${m.id}`} tabIndex={-1} className={`msg ${m.est_moi ? 'moi' : 'lui'} ${suite ? 'suite' : ''} type-${(m.type ?? 'TEXTE').toLowerCase()}`}>
      {m.reponse_a && (
        <button type="button" className="citation" onClick={() => onCitation(m.reponse_a.id)}>
          <b>{m.reponse_a.expediteur ?? 'Message'}</b><span>{m.reponse_a.apercu}</span>
        </button>
      )}

      {m.type === 'IMAGE' && f && (
        <a href={f.url} target="_blank" rel="noreferrer" className="media"><img src={f.url} alt="" loading="lazy" /></a>
      )}
      {m.type === 'VIDEO' && f && <video className="media" src={f.url} controls preload="metadata" />}
      {m.type === 'AUDIO' && f && <LecteurVocal url={f.url} graine={m.id} auteur={m.est_moi ? m.expediteur : interlocuteur} />}
      {m.type === 'FICHIER' && f && (
        <a href={f.url} target="_blank" rel="noreferrer" className="doc" download={f.nom}>
          <span className="ext">{extension(f.nom)}</span>
          <div><b>{f.nom}</b><small>Ouvrir ou télécharger</small></div>
        </a>
      )}

      {m.contenu && <p className="texte">{m.contenu}{!['IMAGE', 'VIDEO'].includes(m.type) && meta}</p>}
      {(!m.contenu || ['IMAGE', 'VIDEO'].includes(m.type)) && <div className="meta-seule">{meta}</div>}

      {!m.temporaire && !m.echec && (
        <button type="button" className="repondre-msg" onClick={() => onRepondre(m)}>Répondre</button>
      )}
    </div>
  )
}