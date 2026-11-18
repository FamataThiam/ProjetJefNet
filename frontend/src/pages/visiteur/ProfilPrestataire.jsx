import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAvisPrestataire, usePrestataire, usePublicationsPrestataire } from '../../api/visiteur'
import ColonneProfil from '../../components/profil/ColonneProfil'
import EnteteProfil from '../../components/profil/EnteteProfil'
import OngletsProfil from '../../components/profil/OngletsProfil'
import Visionneuse from '../../components/profil/Visionneuse'
import { duree, ilYA, initiales, medias, prix, recente } from '../../components/profil/format'
import '../../components/profil/profil.css'

// une publication → les écrans de la visionneuse (une photo ou vidéo = un écran)
const ecrans = (pub, heure) => {
  const liste = medias(pub)
  if (!liste.length) return [{ type: 'TEXTE', titre: pub.titre, texte: pub.description, heure }]
  return liste.map((m) => ({ url: m.url, type: m.type, titre: pub.titre, texte: pub.description, heure }))
}

function Chargement() {
  return (
    <div className="relative isolate mx-auto max-w-6xl animate-pulse px-4 py-10 sm:px-7">
      <Fond />
      <div className="verre-profil h-72 rounded-[34px]" />
      <div className="mt-5 grid gap-3.5 md:grid-cols-3">{[1, 2, 3].map((k) => <div key={k} className="verre-profil h-20 rounded-[22px]" />)}</div>
    </div>
  )
}

function Introuvable({ erreur }) {
  return (
    <div className="relative isolate mx-auto max-w-lg px-4 py-24 text-center">
      <Fond />
      <div className="verre-profil rounded-[30px] p-10">
        <b className="text-2xl font-black text-slate-900 dark:text-white">{erreur ? 'Profil indisponible' : 'Prestataire introuvable'}</b>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          {erreur ? 'Le serveur ne répond pas. Réessaie dans un instant.' : "Ce profil n'existe pas ou n'est plus visible."}
        </p>
        <Link to="/#trouver" className="mt-6 inline-block rounded-2xl bg-gradient-to-r from-[#0174ab] to-[#1a8fd0] px-6 py-3 font-bold text-white">
          Trouver un prestataire
        </Link>
      </div>
    </div>
  )
}

// Page publique : profil d'un prestataire, façon TikTok, avec son statut (publications de moins de 24 h)
export default function ProfilPrestataire() {
  const { id } = useParams()
  const profil = usePrestataire(id)
  const publications = usePublicationsPrestataire(id)
  const avis = useAvisPrestataire(id)
  const [vue, setVue] = useState(null) // { type: 'statut' } | { type: 'pub', i }
  const [statutVu, setStatutVu] = useState(false)

  const pubs = useMemo(() => publications.data?.pages.flatMap((p) => p.data) ?? [], [publications.data])

  // statut : les publications de moins de 24 h, de la plus ancienne à la plus récente (comme WhatsApp)
  const statut = useMemo(() => pubs.filter((p) => recente(p.publiee_le)).map((p) => ({ pub: p, date: p.publiee_le })).reverse(), [pubs])
  const ecransStatut = useMemo(() => statut.flatMap(({ pub, date }) => ecrans(pub, ilYA(date))), [statut])

  if (profil.isPending) return <Chargement />
  if (profil.isError) return <Introuvable erreur={profil.error?.response?.status !== 404} />

  const p = profil.data
  const u = p.prestataire
  const lienConnexion = `/connexion?suite=${encodeURIComponent(`/prestataires/${id}#reserver`)}`
  const totalPubs = publications.data?.pages[0]?.meta.total ?? 0

  const auteur = (
    <span className="grid h-[38px] w-[38px] shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white text-[13px] font-black text-white"
      style={{ background: u.membre?.couleur_perso || '#0174ab' }}>
      {u.membre?.photo_url ? <img src={u.membre.photo_url} alt="" className="h-full w-full object-cover" /> : initiales(u.prenom, u.nom)}
    </span>
  )
  const nomAuteur = `${u.prenom} ${u.nom}`

  return (
    <>
      <main className="relative isolate mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-7 sm:pt-10">
        <Fond />
        <EnteteProfil profil={p} nbRealisations={totalPubs} statut={statut} statutVu={statutVu}
          onOuvrirStatut={() => setVue({ type: 'statut' })} lienConnexion={lienConnexion} />

        {/* services en vedette */}
        {p.services?.length > 0 && (
          <section className="mt-5 grid gap-3.5 md:grid-cols-3">
            {p.services.slice(0, 3).map((s, k) => (
              <Link key={s.id} to={lienConnexion} className="verre-profil apparait flex items-center gap-3.5 rounded-[22px] px-[18px] py-4 transition hover:-translate-y-1"
                style={{ animationDelay: `${k * 80}ms` }}>
                <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-[#0174ab] to-[#38b4ea] font-black text-white">{k + 1}</span>
                <span className="min-w-0">
                  <b className="block truncate text-slate-900 dark:text-white">{s.nom}</b>
                  <small className="text-[13px] text-slate-500 dark:text-slate-400">{[s.unite_tarif, duree(s.duree)].filter(Boolean).join(' · ')}</small>
                </span>
                <em className="ml-auto whitespace-nowrap font-black not-italic text-[#0174ab] dark:text-[#7dd3fc]">{prix(s.prix).replace('FCFA', 'F')}</em>
              </Link>
            ))}
          </section>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_310px]">
          <OngletsProfil profil={p} publications={publications} avis={avis} lienConnexion={lienConnexion}
            onOuvrirPublication={(_, i) => setVue({ type: 'pub', i })} />
          <ColonneProfil profil={p} avis={avis} />
        </div>
      </main>

      {vue?.type === 'statut' && ecransStatut.length > 0 && (
        <Visionneuse elements={ecransStatut} lienReserver={lienConnexion}
          auteur={auteur} nom={nomAuteur}
          onFermer={() => { setVue(null); setStatutVu(true) }} />
      )}

      {vue?.type === 'pub' && pubs[vue.i] && (
        <Visionneuse key={pubs[vue.i].id} elements={ecrans(pubs[vue.i], pubs[vue.i].il_y_a)} lienReserver={lienConnexion}
          auteur={auteur} nom={nomAuteur}
          onFermer={() => setVue(null)}
          onPrecedente={vue.i > 0 ? () => setVue({ type: 'pub', i: vue.i - 1 }) : undefined}
          onSuivante={vue.i < pubs.length - 1 ? () => setVue({ type: 'pub', i: vue.i + 1 }) : undefined} />
      )}
    </>
  )
}

function Fond() {
  return <div className="fond-profil" aria-hidden="true"><i className="t1" /><i className="t2" /><i className="t3" /></div>
}