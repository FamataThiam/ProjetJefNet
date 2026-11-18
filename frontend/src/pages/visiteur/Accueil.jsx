import HeroAccueil from '../../components/accueil/HeroAccueil'
import SectionCarte from '../../components/accueil/SectionCarte'
import SectionMetiers from '../../components/accueil/SectionMetiers'
import SectionAvantApres from '../../components/accueil/SectionAvantApres'
import SectionComment from '../../components/accueil/SectionComment'
import SectionAvis from '../../components/accueil/SectionAvis'
import SectionFaq from '../../components/accueil/SectionFaq'
import '../../components/accueil/accueil.css'

// Page d'accueil du visiteur
export default function Accueil() {
  return (
    <main>
      <HeroAccueil />
      <SectionCarte />
      <SectionMetiers />
      <SectionAvantApres />
      <SectionComment />
      <SectionAvis />
      <SectionFaq />
    </main>
  )
}