import { useState } from 'react'
import { useActionCodeList, useTypesCodeList, useValeursCodeList } from '../../api/admin'
import { erreursChamps, messageErreur } from '../../api/erreurs'
import { EnTete, Vide } from '../../components/admin/communs'
import Modale from '../../components/reservations/Modale'
import useSession from '../../hooks/useSession'
import { droitsDe } from '../../components/admin/outils'

// /admin/listes : les valeurs fixes de l'application (CodeList). Actions réservées au super administrateur.
export default function AdminListes() {
  const { user } = useSession()
  const { superAdmin } = droitsDe(user)
  const types = useTypesCodeList()
  const [type, setType] = useState(null)
  const actuel = type ?? types.data?.[0]?.type
  const valeurs = useValeursCodeList(actuel)
  const action = useActionCodeList()
  const [ajout, setAjout] = useState(false)

  return (
    <main className="adm-contenu">
      <EnTete titre="Listes de valeurs" sous="Les valeurs fixes utilisées par l’application (CodeList).">
        {superAdmin && actuel && <button type="button" className="rs-btn plein" onClick={() => { action.reset(); setAjout(true) }}>Ajouter une valeur</button>}
      </EnTete>
      {!superAdmin && <p className="adm-note">Lecture seule : seul le super administrateur peut ajouter, activer ou désactiver une valeur.</p>}
      {action.isError && !ajout && <p className="rs-erreur">{messageErreur(action.error)}</p>}

      {types.isPending && <div className="adm-cls"><div className="ep-squelette" style={{ height: 360 }} /><div className="ep-squelette" style={{ height: 360 }} /></div>}
      {types.isError && <p className="rs-erreur">{messageErreur(types.error)}</p>}

      {types.isSuccess && (
        <div className="adm-cls">
          <nav className="adm-carte adm-types">
            {types.data.map((t) => (
              <button key={t.type} type="button" className={actuel === t.type ? 'on' : ''} onClick={() => setType(t.type)}>
                {t.type}<i>{t.actives}{t.inactives ? ` + ${t.inactives}` : ''}</i>
              </button>
            ))}
          </nav>
          <div className="adm-carte adm-table">
            {valeurs.isPending && <div className="ep-squelette" style={{ height: 200, margin: 12 }} />}
            {valeurs.isSuccess && valeurs.data.length === 0 && <Vide titre="Aucune valeur">Cette liste est vide.</Vide>}
            {valeurs.data?.length > 0 && (
              <table>
                <thead><tr><th>Valeur</th><th>Description</th><th>Origine</th><th>État</th><th /></tr></thead>
                <tbody>
                  {valeurs.data.map((v) => {
                    const active = v.etat === 'ACTIF' || v.etat === true
                    return (
                      <tr key={v.id} className="fixe">
                        <td><span className="adm-code">{v.valeur}</span></td>
                        <td>{v.description || '—'}</td>
                        <td><span className={`adm-pastille ${v.systeme ? 'bleu' : 'gris'}`}>{v.systeme ? 'Système' : 'Ajoutée'}</span></td>
                        <td><span className={`adm-pastille ${active ? 'ok' : 'gris'}`}>{active ? 'Active' : 'Inactive'}</span></td>
                        <td className="act">
                          {v.systeme ? <small className="adm-gris">Utilisée par le code</small>
                            : superAdmin && (active
                              ? <button type="button" className="adm-mini rouge" disabled={action.isPending} onClick={() => action.mutate({ id: v.id, action: 'desactiver' })}>Désactiver</button>
                              : <button type="button" className="adm-mini vert" disabled={action.isPending} onClick={() => action.mutate({ id: v.id, action: 'activer' })}>Activer</button>)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {ajout && <FenetreValeur type={actuel} action={action} onFermer={() => setAjout(false)} />}
    </main>
  )
}

function FenetreValeur({ type, action, onFermer }) {
  const [valeur, setValeur] = useState('')
  const [description, setDescription] = useState('')
  const erreurs = erreursChamps(action.error)
  const code = valeur.toUpperCase().replace(/\s+/g, '_')
  return (
    <Modale titre="Ajouter une valeur" sousTitre={`Liste ${type}`} onFermer={onFermer}>
      <label className="ep-lbl haut" htmlFor="cl-val">Valeur</label>
      <input id="cl-val" className="rs-champ" maxLength={50} value={valeur} placeholder="Ex. : VIREMENT" onChange={(e) => setValeur(e.target.value)} />
      <p className="rs-aide">Enregistrée sous la forme <span className="adm-code">{code || 'VALEUR'}</span> (lettres, chiffres, espaces, - et _).</p>
      {erreurs.valeur && <p className="rs-champ-err">{erreurs.valeur}</p>}
      <label className="ep-lbl" htmlFor="cl-desc">Description (facultative)</label>
      <input id="cl-desc" className="rs-champ" maxLength={255} value={description} onChange={(e) => setDescription(e.target.value)} />
      {action.isError && !Object.keys(erreurs).length && <p className="rs-erreur">{messageErreur(action.error)}</p>}
      <div className="rs-pied">
        <button type="button" className="rs-btn contour" onClick={onFermer}>Annuler</button>
        <button type="button" className="rs-btn plein" disabled={!valeur.trim() || action.isPending}
          onClick={() => action.mutate({ action: 'ajouter', type, valeur: code, description: description.trim() || null }, { onSuccess: onFermer })}>
          {action.isPending ? 'Ajout…' : 'Ajouter'}
        </button>
      </div>
    </Modale>
  )
}