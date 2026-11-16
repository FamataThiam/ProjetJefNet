import { useEffect, useState } from 'react'
import axios from 'axios'
import ArcTheme from './components/ui/ArcTheme'

export default function App() {
  const [msg, setMsg] = useState('Connexion…')

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/ping`)
      .then(r => setMsg(r.data.message))
      .catch(() => setMsg('Erreur : le backend ne répond pas'))
  }, [])

    return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-fond p-6">
      <h1 className="text-3xl font-bold text-texte">{msg}</h1>
      <ArcTheme />
      <div className="w-full max-w-sm rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
        <p className="font-semibold text-texte">Carte d'essai</p>
        <p className="mt-1 text-sm text-texte-doux">Ce texte reste lisible quelle que soit la couleur.</p>
        <button className="mt-4 rounded-lg bg-jef px-4 py-2 text-sm font-semibold text-white">Bouton JefNet</button>
      </div>
    </div>
  )
}