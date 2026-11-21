import { useEffect, useRef, useState } from 'react'
import { messageErreur } from '../../api/auth'
import { useModifierProfil } from '../../api/compte'

const PALETTE = ['#0174AB', '#0E9F6E', '#7C3AED', '#DB2777', '#EA580C', '#CA8A04',
  '#0891B2', '#4F46E5', '#DC2626', '#059669', '#9333EA', '#334155']


export default function ChoixCouleur({ actuelle, onEssai }) {
  const modifier = useModifierProfil()
  const [etat, setEtat] = useState('')
  const minuteur = useRef(null)

  useEffect(() => () => clearTimeout(minuteur.current), [])

  const enregistrer = (couleur) => {
    onEssai(couleur)
    setEtat('enregistrement')
    clearTimeout(minuteur.current)
    // petit délai : avec le sélecteur libre, on n'envoie pas une requête par mouvement de souris
    minuteur.current = setTimeout(() => {
      modifier.mutate({ couleur_perso: couleur.toUpperCase() }, {
        onSuccess: () => { setEtat('ok'); onEssai(null) },
        onError: () => { setEtat('erreur'); onEssai(null) },
      })
    }, 500)
  }

  const memeCouleur = (c) => c.toLowerCase() === (actuelle ?? '').toLowerCase()

  return (
    <section className="verre carte-espace couleur-espace">
      <h2>Ma couleur</h2>
      <p className="aide">Elle habille ton espace. Le reste de JefNet garde son bleu.</p>
      <div className="pastilles">
        {PALETTE.map((c) => (
          <button key={c} type="button" style={{ background: c, color: c }} className={memeCouleur(c) ? 'choisie' : ''}
            onClick={() => enregistrer(c)} aria-label={`Couleur ${c}`} />
        ))}
      </div>
      <label className="autre-couleur">
        <input type="color" value={actuelle ?? '#0174ab'} onChange={(e) => enregistrer(e.target.value)} />
        <span>Autre couleur</span>
        <code>{(actuelle ?? '').toUpperCase()}</code>
      </label>
      <p className={`etat-couleur ${etat}`}>
        {etat === 'enregistrement' && 'Enregistrement…'}
        {etat === 'ok' && 'Couleur enregistrée.'}
        {etat === 'erreur' && messageErreur(modifier.error)}
      </p>
    </section>
  )
}