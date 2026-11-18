import { useEffect, useState } from 'react'
import { ModeContext } from './mode-context'

const CLE = 'jefnet-mode'


function modeDeDepart() {
  try {
    const garde = localStorage.getItem(CLE)
    if (garde === 'clair' || garde === 'sombre') return garde
  } catch { /* stockage indisponible */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'sombre' : 'clair'
}


export default function ModeProvider({ children }) {
  const [mode, setMode] = useState(modeDeDepart)

  useEffect(() => {
    const racine = document.documentElement
    racine.classList.toggle('dark', mode === 'sombre')
    racine.style.colorScheme = mode === 'sombre' ? 'dark' : 'light'
    try { localStorage.setItem(CLE, mode) } catch { /* stockage indisponible */ }
  }, [mode])

  const basculer = () => setMode((m) => (m === 'sombre' ? 'clair' : 'sombre'))

  return (
    <ModeContext.Provider value={{ mode, sombre: mode === 'sombre', basculer }}>
      {children}
    </ModeContext.Provider>
  )
}