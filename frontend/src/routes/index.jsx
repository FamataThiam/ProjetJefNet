import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Racine from '../layouts/Racine'
import LayoutMembre from '../layouts/LayoutMembre'
import LayoutVisiteur from '../layouts/LayoutVisiteur'
import LayoutSelonSession from '../layouts/LayoutSelonSession'
import { RouteInvite, RouteMembre, RouteProfilIncomplet } from './gardes'

const Accueil = lazy(() => import('../pages/visiteur/Accueil'))
const ProfilPrestataire = lazy(() => import('../pages/visiteur/ProfilPrestataire'))
const Connexion = lazy(() => import('../pages/visiteur/Connexion'))
const Inscription = lazy(() => import('../pages/visiteur/Inscription'))
const AuthCallback = lazy(() => import('../pages/visiteur/AuthCallback'))
const CompleterProfil = lazy(() => import('../pages/visiteur/CompleterProfil'))
const Fil = lazy(() => import('../pages/membre/Fil'))
const CartePrestataires = lazy(() => import('../pages/membre/CartePrestataires'))
const ListePrestataires = lazy(() => import('../pages/membre/ListePrestataires'))
const EspaceClient = lazy(() => import('../pages/membre/EspaceClient'))
const DevenirPrestataire = lazy(() => import('../pages/membre/DevenirPrestataire'))
const Notifications = lazy(() => import('../pages/membre/Notifications'))
const PageIntrouvable = lazy(() => import('../pages/erreurs/PageIntrouvable'))

export const routeur = createBrowserRouter([
  {
    element: <Racine />,
    children: [
      // pages du visiteur AVEC navbar + footer
      {
        element: <LayoutVisiteur />,
        children: [
          { path: '/', element: <Accueil /> },
        ],
      },

      // pages ouvertes à tous : barre du fil si on est connecté, barre de l'accueil sinon
      {
        element: <LayoutSelonSession />,
        children: [
          { path: '/prestataires/:id', element: <ProfilPrestataire /> },
        ],
      },

      // pages SANS navbar ni footer, seulement pour les non connectés
      {
        element: <RouteInvite />,
        children: [
          { path: '/connexion', element: <Connexion /> },
          { path: '/inscription', element: <Inscription /> },
        ],
      },

      // retour de Google / GitHub / Facebook (sans navbar)
      { path: '/auth/callback', element: <AuthCallback /> },

      // connecté mais profil pas encore complété
      {
        element: <RouteProfilIncomplet />,
        children: [
          { path: '/completer-profil', element: <CompleterProfil /> },
        ],
      },

      // espace du membre connecté (profil complété)
      {
        element: <RouteMembre />,
        children: [
          {
            element: <LayoutMembre />,
            children: [
              { path: '/fil', element: <Fil /> },
              { path: '/carte', element: <CartePrestataires /> },
              { path: '/domaines/:id', element: <ListePrestataires /> },
              { path: '/recherche', element: <ListePrestataires /> },
              { path: '/espace', element: <EspaceClient /> },
              { path: '/devenir-prestataire', element: <DevenirPrestataire /> },
              { path: '/notifications', element: <Notifications /> },
            ],
          },
        ],
      },

      { path: '*', element: <PageIntrouvable /> },
    ],
  },
])