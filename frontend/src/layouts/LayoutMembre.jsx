import { Outlet } from 'react-router-dom'
import BarreMembre from '../components/membre/BarreMembre'
import useTempsReel from '../hooks/useTempsReel'
import '../components/membre/membre.css'
import '../components/visiteur/visiteur.css'


export default function LayoutMembre() {
  useTempsReel() // notifications en direct (Reverb)
  return (
    <div className="mb">
      <div className="fond-mb" aria-hidden="true"><i className="t1" /><i className="t2" /></div>
      <BarreMembre />
      <Outlet />
    </div>
  )
}