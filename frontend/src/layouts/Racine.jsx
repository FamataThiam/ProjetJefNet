import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

import Chargement from '../components/chargement/Chargement'


export default function Racine() {
  return (
    <>
      
      {/* pendant qu'une page se télécharge, on affiche le chargement liquide */}
      <Suspense fallback={<Chargement plein />}>
        <Outlet />
      </Suspense>
    </>
  )
}