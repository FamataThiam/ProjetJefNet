import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFil, usePremierDuFil, useRecommandations, useStories } from '../../api/fil'
import BandeStatuts from '../../components/fil/BandeStatuts'
import { CarteNouveauxCertifies, CartePrestationsReussies, CarteRecommandes } from '../../components/fil/CartesFil'
import ColonneDroite from '../../components/fil/ColonneDroite'
import ColonneGauche from '../../components/fil/ColonneGauche'
import FilSquelette, { SqPublication } from '../../components/fil/FilSquelette'
import Publication from '../../components/fil/Publication'
import Avatar from '../../components/membre/Avatar'
import { medias as triees } from '../../components/profil/format'
import Visionneuse from '../../components/profil/Visionneuse'
import useSession from '../../hooks/useSession'
import '../../components/profil/profil.css'
import RaccourciPublier from '../../components/espace-pro/RaccourciPublier'

const ONGLETS = [['pour-vous', 'Pour vous'], ['mes-prestataires', 'Mes prestataires'], ['pres', 'Près de moi']]

// Barre fine en haut de l'écran pendant un chargement (façon YouTube)
function Progression({ actif }) {
  const [etat, setEtat] = useState('')
  useEffect(() => {
    if (actif) { setEtat(''); const t = requestAnimationFrame(() => setEtat('court')); return () => cancelAnimationFrame(t) }
    setEtat((e) => (e ? 'fini' : ''))
  }, [actif])
  return <div className={`progression ${etat}`} />
}

export default function Fil() {
  const { user } = useSession()
  const client = useQueryClient()
  const [onglet, setOnglet] = useState('pour-vous')
  const [position, setPosition] = useState(null)
  const [media, setMedia] = useState(null) // { pub, depart }

  const fil = useFil(onglet, onglet === 'pres' ? position : null)
  const stories = useStories()
  const recommandations = useRecommandations()
  const pubs = useMemo(() => fil.data?.pages.flatMap((p) => p.data) ?? [], [fil.data])
  const cartes = fil.data?.pages[0]?.cartes


  useEffect(() => {
    if (onglet !== 'pres' || position || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (p) => setPosition({ lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) }),
      () => {},
      { timeout: 8000, maximumAge: 10 * 60 * 1000 },
    )
  }, [onglet, position])


  const veille = usePremierDuFil(onglet, Boolean(pubs.length))
  const nouveau = veille.data != null && pubs[0] && veille.data !== pubs[0].id

  const rafraichir = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    client.resetQueries({ queryKey: ['fil', onglet] })
    client.invalidateQueries({ queryKey: ['stories'] })
  }


  const bas = useRef(null)
  useEffect(() => {
    const el = bas.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && fil.hasNextPage && !fil.isFetchingNextPage) fil.fetchNextPage()
    }, { rootMargin: '600px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [fil])


  const barre = useRef(null)
  const [glisseur, setGlisseur] = useState({})
  useLayoutEffect(() => {
    const placer = () => {
      const b = barre.current?.querySelector('button.on')
      if (b) setGlisseur({ left: b.offsetLeft, width: b.offsetWidth })
    }
    placer()
    addEventListener('resize', placer)
    return () => removeEventListener('resize', placer)
  }, [onglet, fil.isPending])

  const premierChargement = fil.isPending && !fil.data && onglet === 'pour-vous'
  if (!user || premierChargement) return <><Progression actif /><FilSquelette /></>

  const elementsMedia = media ? triees(media.pub).map((m) => ({ url: m.url, type: m.type, titre: media.pub.titre, texte: media.pub.description, heure: media.pub.il_y_a })) : []

  return (
    <>
      <Progression actif={fil.isFetching && !fil.isFetchingNextPage} />
      <main className="page-fil">
        <ColonneGauche user={user} />

        <section className="col-c">
          <BandeStatuts stories={stories} />
          <RaccourciPublier />

          <div ref={barre} className="bloc onglets-fil apparait" style={{ animationDelay: '.06s' }}>
            <span className="glisseur" style={glisseur} />
            {ONGLETS.map(([cle, libelle]) => (
              <button key={cle} type="button" className={onglet === cle ? 'on' : ''} onClick={() => setOnglet(cle)}>{libelle}</button>
            ))}
          </div>

          {nouveau && (
            <div className="nouveautes"><button type="button" onClick={rafraichir}>Nouvelles publications ↑</button></div>
          )}

          {fil.isPending && <><SqPublication photos={2} /><SqPublication photos={1} /></>}

          {fil.isError && (
            <div className="bloc vide-fil"><b>Le fil n'a pas pu être chargé</b>Vérifie ta connexion puis <button type="button" className="voir-plus" style={{ color: 'var(--bleu)' }} onClick={() => fil.refetch()}>réessaie</button>.</div>
          )}

          {fil.isSuccess && !pubs.length && (
            <div className="bloc vide-fil apparait">
              <b>{onglet === 'mes-prestataires' ? 'Pas encore de prestataires' : 'Rien par ici pour le moment'}</b>
              {onglet === 'mes-prestataires'
                ? 'Les réalisations des prestataires que tu as réservés apparaîtront ici.'
                : 'Reviens bientôt : de nouvelles réalisations sont publiées chaque jour.'}
            </div>
          )}

          {pubs.map((pub, i) => (
            <div key={pub.id} style={{ display: 'contents' }}>
              <Publication pub={pub} style={{ animationDelay: `${Math.min(i % 10, 4) * 0.06}s` }}
                onOuvrirMedia={(p, depart) => setMedia({ pub: p, depart })} />
              {onglet === 'pour-vous' && i === 1 && <CarteRecommandes recommandations={recommandations.data} />}
              {onglet === 'pour-vous' && i === 4 && <CartePrestationsReussies avis={cartes?.prestations_reussies} />}
              {onglet === 'pour-vous' && i === 7 && <CarteNouveauxCertifies profils={cartes?.nouveaux_certifies} />}
            </div>
          ))}

          <div ref={bas} />
          {fil.isFetchingNextPage && <SqPublication photos={2} />}
          {fil.isSuccess && pubs.length > 0 && !fil.hasNextPage && <p className="fin-fil">Tu as tout vu pour le moment ✓</p>}
        </section>

        <ColonneDroite recommandations={recommandations.data} />
      </main>

      {media && elementsMedia.length > 0 && (
        <Visionneuse elements={elementsMedia} depart={media.depart}
          lienReserver={`/prestataires/${media.pub.prestataire.uuid}#reserver`}
          auteur={<Avatar nom={media.pub.prestataire.nom} photo={media.pub.prestataire.photo_url} px={38} />}
          nom={media.pub.prestataire.nom} onFermer={() => setMedia(null)} />
      )}
    </>
  )
}