import { useEffect, useState } from 'react'
import axios from 'axios'

export default function App() {
  const [msg, setMsg] = useState('Connexion…')

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/ping`)
      .then(r => setMsg(r.data.message))
      .catch(() => setMsg('Erreur : le backend ne répond pas'))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <h1 className="text-3xl font-bold text-[#0174AB]">{msg}</h1>
    </div>
  )
}