import { Outlet } from 'react-router-dom'
import BarreNavigation from '../components/visiteur/BarreNavigation'
import PiedDePage from '../components/visiteur/PiedDePage'
import Assistant from '../components/assistant/Assistant'
import '../components/visiteur/visiteur.css'

// Mise en page des pages publiques : barre de navigation + contenu + pied de page + JefIA
export default function LayoutVisiteur() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f9fc] text-slate-800 transition-colors duration-500 dark:bg-[#06111f] dark:text-slate-100">
      <BarreNavigation />
      <div className="flex-1">
        <Outlet />
      </div>
      <PiedDePage />
      <Assistant />
    </div>
  )
}