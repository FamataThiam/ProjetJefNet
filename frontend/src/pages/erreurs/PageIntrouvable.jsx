import { Link } from 'react-router-dom'

// Page 404 : le mot « Oups ! » est rempli d'une image de galaxie qui défile lentement
export default function PageIntrouvable() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <h1
        className="oups select-none font-[Montserrat] text-[clamp(5rem,22vw,15rem)] font-black leading-none tracking-tight"
        aria-label="Oups !"
      >
        Oups!
      </h1>

      <h2 className="mt-4 font-[Montserrat] text-xl font-bold uppercase tracking-wide text-slate-900 sm:text-2xl">
        404 - Page introuvable
      </h2>
      <p className="mt-3 max-w-md text-sm text-slate-600 sm:text-base">
        La page que vous cherchez a peut-être été supprimée, a changé de nom ou est temporairement indisponible.
      </p>

      <Link
        to="/"
        className="mt-8 rounded-full bg-jef px-8 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-jef/30 transition hover:-translate-y-0.5 hover:bg-[#015d89] focus:outline-none focus-visible:ring-4 focus-visible:ring-jef/30"
      >
        Retour à l'accueil
      </Link>
    </main>
  )
}
