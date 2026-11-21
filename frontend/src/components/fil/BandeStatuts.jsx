import { useMemo, useState } from 'react'
import { medias as triees } from '../profil/format'
import Avatar from '../membre/Avatar'
import Visionneuse from '../profil/Visionneuse'
import { SqStatuts } from './FilSquelette'

const CLE_VUS = 'jefnet-statuts-vus'
const lireVus = () => { try { return new Set(JSON.parse(localStorage.getItem(CLE_VUS) || '[]')) } catch { return new Set() } }
const garderVus = (vus) => { try { localStorage.setItem(CLE_VUS, JSON.stringify([...vus].slice(-300))) } catch { /* rien */ } }

// Statuts : les publications de moins de 24 h, regroupées par prestataire
export default function BandeStatuts({ stories }) {
  const [vus, setVus] = useState(lireVus)
  const [ouvert, setOuvert] = useState(null) // index du prestataire affiché

  const groupes = useMemo(() => {
    const parUuid = new Map()
    for (const pub of stories.data ?? []) {
      const g = parUuid.get(pub.prestataire.uuid) ?? { prestataire: pub.prestataire, pubs: [] }
      g.pubs.push(pub)
      parUuid.set(pub.prestataire.uuid, g)
    }
    return [...parUuid.values()]
      .map((g) => ({ ...g, pubs: g.pubs.sort((a, b) => new Date(a.publiee_le) - new Date(b.publiee_le)) }))
      .sort((a, b) => Number(a.pubs.every((p) => vus.has(p.id))) - Number(b.pubs.every((p) => vus.has(p.id))))
  }, [stories.data, vus])

  if (stories.isPending) return <SqStatuts />
  if (!groupes.length) {
    return <div className="bloc statuts-vide apparait">Aucun statut pour le moment. Les réalisations publiées depuis moins de 24 h apparaîtront ici.</div>
  }

  const marquer = (i) => {
    const suivant = new Set(vus)
    groupes[i]?.pubs.forEach((p) => suivant.add(p.id))
    setVus(suivant)
    garderVus(suivant)
  }
  const aller = (i) => { if (ouvert != null) marquer(ouvert); setOuvert(i >= 0 && i < groupes.length ? i : null) }

  const g = ouvert != null ? groupes[ouvert] : null
  const elements = g ? g.pubs.flatMap((pub) => triees(pub).map((m) => ({ url: m.url, type: m.type, titre: pub.titre, texte: pub.description, heure: pub.il_y_a }))) : []

  return (
    <>
      <div className="bloc statuts apparait">
        {groupes.map((gr, i) => (
          <button key={gr.prestataire.uuid} type="button" className={`statut ${gr.pubs.every((p) => vus.has(p.id)) ? 'vu' : ''}`} onClick={() => setOuvert(i)}>
            <div className="anneau"><Avatar nom={gr.prestataire.nom} photo={gr.prestataire.photo_url} taille="" /></div>
            <span>{gr.prestataire.nom.split(' ')[0]} {gr.prestataire.nom.split(' ')[1]?.[0] ?? ''}.</span>
          </button>
        ))}
      </div>

      {g && elements.length > 0 && (
        <Visionneuse key={g.prestataire.uuid} elements={elements} lienReserver={`/prestataires/${g.prestataire.uuid}#reserver`}
          auteur={<Avatar nom={g.prestataire.nom} photo={g.prestataire.photo_url} px={38} />} nom={g.prestataire.nom}
          onFermer={() => aller(-1)}
          onPrecedente={ouvert > 0 ? () => aller(ouvert - 1) : undefined}
          onSuivante={() => aller(ouvert + 1)} />
      )}
    </>
  )
}