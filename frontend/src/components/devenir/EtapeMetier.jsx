import { EXPERIENCES } from './donnees'

export default function EtapeMetier({ metier, changer, erreurs }) {
  const champ = (nom) => ({
    id: `m-${nom}`,
    value: metier[nom],
    onChange: (e) => changer({ [nom]: e.target.value }),
  })

  return (
    <div className="vue-dp">
      <h2>Mon métier</h2>
      <p className="sous">Ce que les clients liront en premier sur ta fiche.</p>

      <div className={`champ-dp ${erreurs.titre_professionnel ? 'erreur' : ''}`}>
        <label htmlFor="m-titre_professionnel">Titre professionnel</label>
        <input {...champ('titre_professionnel')} maxLength={100} placeholder="Électricienne en bâtiment" autoFocus />
        {erreurs.titre_professionnel ? <small className="msg-erreur">{erreurs.titre_professionnel}</small>
          : <small>Exemples : Plombier, Coiffeuse à domicile, Professeur de maths</small>}
      </div>

      <div className="champ-dp">
        <span className="libelle">Expérience</span>
        <div className="puces-dp">
          {EXPERIENCES.map((x) => (
            <button key={x} type="button" className={metier.experience === x ? 'on' : ''}
              onClick={() => changer({ experience: metier.experience === x ? '' : x })}>{x}</button>
          ))}
        </div>
      </div>

      <div className={`champ-dp ${erreurs.biographie ? 'erreur' : ''}`}>
        <label htmlFor="m-biographie">Présentation <em>(facultatif)</em></label>
        <textarea {...champ('biographie')} maxLength={2000} placeholder="Ce que tu fais, ta façon de travailler…" />
        <div className="compteur">{metier.biographie.length} / 2000</div>
        {erreurs.biographie && <small className="msg-erreur">{erreurs.biographie}</small>}
      </div>

      <div className="deux-dp">
        <div className={`champ-dp ${erreurs.linkedin ? 'erreur' : ''}`}>
          <label htmlFor="m-linkedin">LinkedIn <em>(facultatif)</em></label>
          <input {...champ('linkedin')} inputMode="url" placeholder="https://linkedin.com/in/…" />
          {erreurs.linkedin && <small className="msg-erreur">{erreurs.linkedin}</small>}
        </div>
        <div className={`champ-dp ${erreurs.portfolio ? 'erreur' : ''}`}>
          <label htmlFor="m-portfolio">Portfolio <em>(facultatif)</em></label>
          <input {...champ('portfolio')} inputMode="url" placeholder="https://…" />
          {erreurs.portfolio && <small className="msg-erreur">{erreurs.portfolio}</small>}
        </div>
      </div>
    </div>
  )
}