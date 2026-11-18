import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Racine from '../layouts/Racine'
import LayoutVisiteur from '../layouts/LayoutVisiteur'

const Accueil = lazy(() => import('../pages/visiteur/Accueil'))
const ProfilPrestataire = lazy(() => import('../pages/visiteur/ProfilPrestataire'))
const PageIntrouvable = lazy(() => import('../pages/erreurs/PageIntrouvable'))

export const routeur = createBrowserRouter([
  {
    element: <Racine />,
    children: [
  
      {
        element: <LayoutVisiteur />,
        children: [
         { path: '/', element: <Accueil /> },
         { path: '/prestataires/:id', element: <ProfilPrestataire /> },
        ],
      },
      { path: '*', element: <PageIntrouvable /> }, 
    ],
  },
])