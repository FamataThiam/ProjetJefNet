import { useCallback, useEffect, useRef, useState } from 'react'
import { lancerAppel, rejoindreAppel, terminerAppel } from '../api/messagerie'
import { messageErreur } from '../api/auth'
import AppelEntrant from '../components/messagerie/AppelEntrant'
import EcranAppel from '../components/messagerie/EcranAppel'
import { AppelContext } from './appel-context'
import '../components/messagerie/appel.css'

const SONNERIE_MAX = 45 * 1000 


export default function AppelProvider({ children }) {
  const [appel, setAppel] = useState(null) 
  const [info, setInfo] = useState('')      
  const appelRef = useRef(null)
  useEffect(() => { appelRef.current = appel }, [appel])

  const fermer = useCallback((message = '') => {
    appelRef.current = null
    setAppel(null)
    if (message) {
      setInfo(message)
      setTimeout(() => setInfo(''), 3000)
    }
  }, [])

  
  const appeler = useCallback(async (conversation) => {
    if (appelRef.current) return
    const nouveau = { phase: 'sortant', uuid: conversation.uuid, interlocuteur: conversation.interlocuteur, salle: null }
    appelRef.current = nouveau
    setAppel(nouveau)
    try {
      const salle = await lancerAppel(conversation.uuid)
      setAppel((a) => (a?.uuid === conversation.uuid ? { ...a, salle } : a))
    } catch (e) {
      fermer(messageErreur(e))
    }
  }, [fermer])


  useEffect(() => {
    const entrant = ({ detail }) => {
      if (appelRef.current) return // déjà en appel : on ignore
      const nouveau = { phase: 'entrant', uuid: detail.conversation_uuid, interlocuteur: detail.appelant, salle: null }
      appelRef.current = nouveau
      setAppel(nouveau)
    }
    const termine = ({ detail }) => {
      if (appelRef.current?.uuid !== detail.conversation_uuid) return
      const textes = { REFUSE: 'Appel refusé', ANNULE: appelRef.current.phase === 'entrant' ? 'Appel manqué' : 'Appel annulé', TERMINE: 'Appel terminé' }
      fermer(textes[detail.raison] ?? 'Appel terminé')
    }
    addEventListener('jefnet:appel-entrant', entrant)
    addEventListener('jefnet:appel-termine', termine)
    return () => { removeEventListener('jefnet:appel-entrant', entrant); removeEventListener('jefnet:appel-termine', termine) }
  }, [fermer])

  
  const phase = appel?.phase
  const uuid = appel?.uuid
  useEffect(() => {
    if (phase !== 'sortant' && phase !== 'entrant') return
    const t = setTimeout(() => {
      if (phase === 'sortant') terminerAppel(uuid, 'ANNULE') // le backend laisse « Appel vidéo manqué » dans la discussion
      fermer(phase === 'sortant' ? 'Pas de réponse' : 'Appel manqué')
    }, SONNERIE_MAX)
    return () => clearTimeout(t)
  }, [phase, uuid, fermer])


  useEffect(() => {
    if (phase !== 'entrant') return
    const titre = document.title
    let pair = false
    const t = setInterval(() => {
      pair = !pair
      document.title = pair ? `Appel de ${appelRef.current?.interlocuteur?.nom ?? 'JefNet'}…` : titre
    }, 1000)
    return () => { clearInterval(t); document.title = titre }
  }, [phase])

  const decrocher = async () => {
    const a = appelRef.current
    try {
      const salle = await rejoindreAppel(a.uuid)
      setAppel({ ...a, phase: 'encours', salle })
    } catch (e) {
      fermer(messageErreur(e))
    }
  }

  const refuser = () => {
    terminerAppel(appelRef.current.uuid, 'REFUSE')
    fermer()
  }

  const raccrocher = () => {
    const a = appelRef.current
    if (!a) return
    terminerAppel(a.uuid, a.phase === 'sortant' ? 'ANNULE' : 'TERMINE')
    fermer(a.phase === 'sortant' ? '' : 'Appel terminé')
  }


  const connecte = () => setAppel((a) => (a && a.phase === 'sortant' ? { ...a, phase: 'encours' } : a))

  return (
    <AppelContext.Provider value={{ appeler, enAppel: Boolean(appel) }}>
      {children}
      {appel?.phase === 'entrant' && <AppelEntrant interlocuteur={appel.interlocuteur} onDecrocher={decrocher} onRefuser={refuser} />}
      {appel && appel.phase !== 'entrant' && (
        <EcranAppel appel={appel} onConnecte={connecte} onRaccrocher={raccrocher} onQuitte={() => raccrocher()} />
      )}
      {info && <div className="info-appel" role="status">{info}</div>}
    </AppelContext.Provider>
  )
}