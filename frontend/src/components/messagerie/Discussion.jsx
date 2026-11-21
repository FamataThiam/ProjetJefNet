import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { messageErreur } from '../../api/auth'
import {
  apercuDe, changerMessages, monMembreId, useArchiver, useConversation, useEnvoyerMessage, useMarquerLus, useMessages,
} from '../../api/messagerie'
import { useAppel } from '../../contexts/appel-context'
import useSession from '../../hooks/useSession'
import { ouvrirEcho } from '../../lib/echo'
import Avatar from '../membre/Avatar'
import { IconeCamera } from './AppelEntrant'
import Bulle from './Bulle'
import Saisie from './Saisie'
import { libelleJour, memeJour } from './temps'

// Partie droite : la discussion avec un membre
export default function Discussion({ uuid }) {
  const { user } = useSession()
  const moi = monMembreId(user)
  const client = useQueryClient()
  const conversation = useConversation(uuid)
  const messages = useMessages(uuid)
  const envoyer = useEnvoyerMessage(uuid, { id: moi, nom: `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim(), photo: user?.membre?.photo_url })
  const lire = useMarquerLus(uuid)
  const archiver = useArchiver(uuid)
  const { appeler, enAppel } = useAppel()

  const [reponse, setReponse] = useState(null)
  const [ecrit, setEcrit] = useState(false)
  const [menu, setMenu] = useState(false)
  const fil = useRef(null)
  const haut = useRef(null)

  const c = conversation.data
  const autre = c?.interlocuteur
  const items = useMemo(() => messages.data?.pages.flatMap((p) => p.data) ?? [], [messages.data]) // du plus récent au plus ancien

  // nouvelle discussion ouverte : on repart de zéro
  useEffect(() => { setReponse(null); setEcrit(false); setMenu(false) }, [uuid])

  // ---------- lecture : dès qu'il y a des messages de l'autre non lus et que la page est visible
  const aLire = items.some((m) => !m.est_moi && !m.est_lu && !m.temporaire)
  const { mutate: marquerLus } = lire
  useEffect(() => {
    if (!aLire) return
    const faire = () => {
      if (document.visibilityState !== 'visible') return
      changerMessages(client, uuid, (m) => (m.est_moi ? m : { ...m, est_lu: true }))
      marquerLus()
    }
    faire()
    document.addEventListener('visibilitychange', faire)
    return () => document.removeEventListener('visibilitychange', faire)
  }, [aLire, uuid, client, marquerLus])

  // ---------- temps réel propre à cette discussion : « lu » et « en train d'écrire… »
  const canal = useRef(null)
  useEffect(() => {
    const echo = ouvrirEcho()
    if (!echo || !uuid) return
    let minuteur
    canal.current = echo.private(`conversation.${uuid}`)
      .listen('.messages.lus', ({ lecteur_id }) => {
        if (lecteur_id !== moi) changerMessages(client, uuid, (m) => (m.est_moi ? { ...m, est_lu: true } : m))
      })
      .listenForWhisper('ecrit', ({ membre_id }) => {
        if (membre_id === moi) return
        setEcrit(true)
        clearTimeout(minuteur)
        minuteur = setTimeout(() => setEcrit(false), 3500)
      })
    // un message de l'autre arrive : il n'écrit plus
    const arrivee = ({ detail }) => { if (detail.uuid === uuid && !detail.message.est_moi) setEcrit(false) }
    addEventListener('jefnet:message', arrivee)
    return () => { clearTimeout(minuteur); echo.leave(`conversation.${uuid}`); canal.current = null; removeEventListener('jefnet:message', arrivee) }
  }, [uuid, moi, client])

  // je tape : on prévient l'autre (au plus une fois toutes les 2,5 s)
  const dernierSignal = useRef(0)
  const signalerFrappe = () => {
    if (Date.now() - dernierSignal.current < 2500) return
    dernierSignal.current = Date.now()
    canal.current?.whisper('ecrit', { membre_id: moi })
  }

  // ---------- anciens messages quand on remonte tout en haut
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = messages
  useEffect(() => {
    const el = haut.current
    if (!el || !hasNextPage) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !isFetchingNextPage) fetchNextPage() }, { root: fil.current, rootMargin: '300px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // ---------- envoi
  const surEnvoi = ({ contenu, fichier, vocal, type }) => {
    envoyer.mutate({ contenu, fichier, vocal, type, reponse })
    setReponse(null)
    fil.current?.scrollTo({ top: 0, behavior: 'smooth' }) // la liste est inversée : 0 = en bas
  }

  // nom : affiché au-dessus de la saisie ; prenom : comme le backend dans reponse_a.expediteur
  const repondre = (m) => setReponse({ id: m.id, est_moi: m.est_moi, nom: m.expediteur?.nom, prenom: m.expediteur?.nom?.split(' ')[0], apercu: apercuDe(m) || 'Message' })

  const allerA = (id) => {
    const el = document.getElementById(`m-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.remove('surligne')
    void el.offsetWidth
    el.classList.add('surligne')
  }

  if (conversation.isError) {
    return <section className="discussion vide-discussion"><p>{messageErreur(conversation.error)}</p><Link to="/messages" className="lien-msg">Retour aux messages</Link></section>
  }

  // les lignes, de la plus récente à la plus ancienne (affichage inversé : la plus récente en bas)
  const lignes = []
  items.forEach((m, i) => {
    const avant = items[i + 1] // message juste au-dessus à l'écran
    const suite = avant && avant.type !== 'APPEL_VIDEO' && m.type !== 'APPEL_VIDEO'
      && avant.est_moi === m.est_moi && memeJour(avant.envoye_le, m.envoye_le)
    lignes.push(<Bulle key={m.id} m={m} suite={suite} interlocuteur={autre} onRepondre={repondre} onCitation={allerA} />)
    if (!avant || !memeJour(avant.envoye_le, m.envoye_le)) {
      lignes.push(<div key={`j-${m.id}`} className="date-msg"><span>{libelleJour(m.envoye_le)}</span></div>)
    }
  })

  const archivee = c?.statut === 'ARCHIVEE'

  return (
    <section className="discussion">
      <header className="tete-discussion">
        <Link to="/messages" className="bt retour-msg" aria-label="Retour aux discussions">
          <svg viewBox="0 0 24 24" className="ic"><path d="M15 5l-7 7 7 7" /></svg>
        </Link>
        {c ? (
          <>
            <Avatar nom={autre?.nom} photo={autre?.photo_url} taille="a42" />
            <div className="qui">
              <b>{autre?.nom}</b>
              <small className={ecrit ? 'ecrit' : ''}>
                {ecrit ? 'en train d’écrire…' : autre?.est_prestataire ? autre.titre ?? 'Prestataire' : `@${autre?.username ?? ''}`}
              </small>
            </div>
            <button type="button" className="bt" title="Appel vidéo" onClick={() => appeler(c)} disabled={enAppel}><IconeCamera /></button>
            <div className="menu-discussion">
              <button type="button" className="bt" onClick={() => setMenu((x) => !x)} aria-label="Plus d'options">
                <svg viewBox="0 0 24 24" className="ic"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
              </button>
              {menu && (
                <div className="menu-flottant" onMouseLeave={() => setMenu(false)}>
                  {autre?.est_prestataire && autre.uuid && <Link to={`/prestataires/${autre.uuid}`}>Voir le profil</Link>}
                  <button type="button" onClick={() => { archiver.mutate(!archivee); setMenu(false) }}>
                    {archivee ? 'Désarchiver la discussion' : 'Archiver la discussion'}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : <div className="qui"><span className="sq-ligne" /></div>}
      </header>

      <div className="fil-msg" ref={fil}>
        {lignes}
        <div ref={haut} className="haut-fil">
          {isFetchingNextPage && <span className="chargement-msg">Chargement…</span>}
          {!hasNextPage && !messages.isPending && (
            <>
              <p className="note-securite">Vos échanges restent sur JefNet. Ne partagez jamais votre code Wave ou Orange Money dans la discussion.</p>
              {items.length === 0 && autre && <p className="dis-bonjour">Dis bonjour à {autre.nom.split(' ')[0]} pour commencer.</p>}
            </>
          )}
          {messages.isPending && [0, 1, 2].map((i) => <div key={i} className={`sq-bulle ${i % 2 ? 'moi' : ''}`} />)}
        </div>
      </div>

      {envoyer.isError && <p className="erreur-envoi">{messageErreur(envoyer.error)}</p>}
      <Saisie reponse={reponse} onAnnulerReponse={() => setReponse(null)} onEnvoyer={surEnvoi} onFrappe={signalerFrappe} desactive={!c} />
    </section>
  )
}