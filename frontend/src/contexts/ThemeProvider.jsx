import { useEffect, useState } from 'react'
import { ThemeContext } from './theme-context'
import { paletteDepuisNiveau } from '../lib/couleurs'

const CLE_NIVEAU = 'jefnet-niveau'
const CLE_COULEURS = 'jefnet-couleurs' // relu par index.html au démarrage (pas de flash)

function niveauDeDepart() {
  try {
    const garde = localStorage.getItem(CLE_NIVEAU)
    if (garde !== null) return Number(garde)
  } catch { /* stockage indisponible */ }
  // première visite : on suit le réglage du téléphone / de l'ordinateur
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 0.1 : 1
}

// Garde le niveau de couleur choisi (0 = bleu nuit, 1 = clair) et l'applique à tout le site
export default function ThemeProvider({ children }) {
  const [niveau, setNiveau] = useState(niveauDeDepart)
  const { sombre } = paletteDepuisNiveau(niveau)

  useEffect(() => {
    const { sombre, variables } = paletteDepuisNiveau(niveau)
    const racine = document.documentElement
    Object.entries(variables).forEach(([nom, valeur]) => racine.style.setProperty(nom, valeur))
    racine.classList.toggle('dark', sombre)
    racine.style.colorScheme = sombre ? 'dark' : 'light'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', variables['--fond'])
    try {
      localStorage.setItem(CLE_NIVEAU, String(niveau))
      localStorage.setItem(CLE_COULEURS, JSON.stringify({ sombre, variables }))
    } catch { /* stockage indisponible */ }
  }, [niveau])

  return (
    <ThemeContext.Provider value={{ niveau, sombre, changerNiveau: setNiveau }}>
      {children}
    </ThemeContext.Provider>
  )
}