import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BoutonEcrire from './BoutonEcrire'
import { ilYA, initiales, moisAnnee, prix, virgule, zone } from './format'

// Photo ronde : anneau qui tourne, ou anneau découpé si le prestataire a un statut (< 24 h)
function Avatar({ membre, prenom, nom, certifie, statut, vu, onOuvrirStatut }) {
  const n = statut.length
  const tour = 2 * Math.PI * 46
  const ecart = n > 1 ? 9 : 0

  return (
    <button type="button" disabled={!n} onClick={onOuvrirStatut} title={n ? 'Voir le statut' : undefined}
      className="avatar-profil group relative h-36 w-36 shrink-0 disabled:cursor-default sm:h-44 sm:w-44">
      {n ? (
        <svg viewBox="0 0 100 100" className="absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)] -rotate-90">
          <defs><linearGradient id="anneau-statut" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0174ab" /><stop offset="1" stopColor="#38b4ea" /></linearGradient></defs>
          {statut.map((_, k) => (
            <circle key={k} cx="50" cy="50" r="46" fill="none" strokeWidth="5" strokeLinecap="round"
              stroke={vu ? '#cbd5e1' : 'url(#anneau-statut)'}
              strokeDasharray={`${tour / n - ecart} ${tour - tour / n + ecart}`} strokeDashoffset={-(k * tour) / n - ecart / 2} />
          ))}
        </svg>
      ) : (
        <span className="anneau-tournant absolute -inset-1.5 rounded-full" />
      )}
      <span className="absolute inset-0 grid place-items-center overflow-hidden rounded-full border-[6px] border-[#f5f9fc] text-5xl font-black text-white transition group-hover:scale-[.97] dark:border-[#06111f]"
        style={{ background: membre?.couleur_perso || '#0174ab' }}>
        {membre?.photo_url ? <img src={membre.photo_url} alt="" className="h-full w-full object-cover" /> : initiales(prenom, nom)}
      </span>
      {certifie && (
        <span className="badge-certifie absolute bottom-2.5 right-1.5 grid h-10 w-10 place-items-center rounded-full border-4 border-[#f5f9fc] bg-[#0174ab] font-black text-white dark:border-[#06111f]"
          title="Prestataire certifié">✓</span>
      )}
      {n > 0 && (
        <span className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border-[3px] border-[#f5f9fc] bg-gradient-to-r from-[#0174ab] to-[#38b4ea] px-3 py-1 text-xs font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(1,116,171,.9)] dark:border-[#06111f]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" /> Statut · {ilYA(statut[n - 1].date)}
        </span>
      )}
    </button>
  )
}

// Chiffre qui monte de 0 à sa valeur
function Compteur({ valeur }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let anim
    const t0 = performance.now()
    const pas = (t) => {
      const p = Math.min(1, (t - t0) / 1200)
      setN(Math.round(valeur * (1 - (1 - p) ** 3)))
      if (p < 1) anim = requestAnimationFrame(pas)
    }
    anim = requestAnimationFrame(pas)
    return () => cancelAnimationFrame(anim)
  }, [valeur])
  return n
}

// En-tête du profil : photo (+ statut), identité, boutons, chiffres, biographie, prix
export default function EnteteProfil({ profil, nbRealisations, statut, statutVu, onOuvrirStatut, lienConnexion, lienReserver = lienConnexion, estMoi = false }) {
  const { prestataire: u } = profil
  const m = u.membre
  const [copie, setCopie] = useState(false)

  const partager = async () => {
    const lien = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: `${u.prenom} ${u.nom} sur JefNet`, url: lien })
      else { await navigator.clipboard.writeText(lien); setCopie(true); setTimeout(() => setCopie(false), 2000) }
    } catch { /* partage annulé */ }
  }

  const btn = 'rounded-2xl px-6 py-3 font-bold transition'

  return (
    <section className="verre-profil apparait relative grid gap-8 overflow-hidden rounded-[34px] p-6 text-center sm:p-9 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:text-left">
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(500px_220px_at_15%_0%,rgba(56,180,234,.25),transparent_70%)]" />

      <div className="relative mx-auto">
        <Avatar membre={m} prenom={u.prenom} nom={u.nom} certifie={profil.est_certifie}
          statut={statut} vu={statutVu} onOuvrirStatut={onOuvrirStatut} />
      </div>

      <div className="relative min-w-0">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">{u.prenom} {u.nom}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {[m?.username && `@${m.username}`, profil.titre_professionnel, [m?.localite, m?.ville].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2.5 lg:justify-start">
          {!estMoi && <Link to={lienReserver} className={`${btn} bg-gradient-to-r from-[#0174ab] to-[#1a8fd0] text-white shadow-[0_12px_26px_-12px_rgba(1,116,171,.9)] hover:-translate-y-0.5`}>Réserver</Link>}
          <BoutonEcrire uuidPrestataire={profil.id} lienConnexion={lienConnexion}
            className={`${btn} bg-[#e3f1fa] text-slate-900 hover:bg-[#d3eafa] dark:bg-white/10 dark:text-white`} />
          <button type="button" onClick={partager} title="Partager le profil"
            className={`${btn} bg-[#e3f1fa] px-4 text-slate-900 hover:bg-[#d3eafa] dark:bg-white/10 dark:text-white`}>
            {copie ? 'Lien copié ✓' : '↗'}
          </button>
        </div>

        <div className="mt-5 flex justify-center gap-7 lg:justify-start">
          {[[<Compteur key="r" valeur={nbRealisations} />, 'réalisations'], [<Compteur key="a" valeur={profil.nombre_avis} />, 'avis'],
            [profil.nombre_avis ? `${virgule(profil.note_moyenne)} ★` : '—', 'note']].map(([v, l]) => (
            <div key={l} className="text-slate-500 dark:text-slate-400">
              <b className="block text-2xl font-black text-slate-900 dark:text-white">{v}</b>{l}
            </div>
          ))}
        </div>

        {profil.biographie && <p className="mx-auto mt-4 max-w-xl leading-relaxed text-slate-700 lg:mx-0 dark:text-slate-300">{profil.biographie}</p>}

        <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
          {profil.est_certifie && <span className="puce-profil">✓ Certifié</span>}
          {profil.domaines?.map((d) => <span key={d} className="puce-profil">{d}</span>)}
          {profil.rayon_intervention && <span className="puce-profil">{zone(profil.rayon_intervention)}</span>}
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-slate-500 lg:justify-start dark:text-slate-400">
          {profil.experience && <span>⏱ {profil.experience}</span>}
          {m?.ville && <span>📍 {[m.localite, m.ville].filter(Boolean).join(', ')}</span>}
          {u.cree_le && <span>📅 Membre depuis {moisAnnee(u.cree_le)}</span>}
        </div>
      </div>

      {profil.prix_min != null && (
        <div className="bloc-prix relative self-start overflow-hidden rounded-[26px] p-6 text-left text-white lg:min-w-[230px]">
          <small className="text-white/85">À partir de</small>
          <b className="mt-0.5 block text-3xl font-black">{prix(profil.prix_min)}</b>
          <small className="text-white/85">Wave · Orange Money · carte</small>
          {!estMoi && <Link to={lienReserver} className="mt-4 block rounded-xl bg-white py-3 text-center text-sm font-extrabold text-[#0174ab] transition hover:-translate-y-0.5">
            Réserver ce prestataire
          </Link>}
        </div>
      )}
    </section>
  )
}