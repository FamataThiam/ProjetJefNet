import { useContext } from 'react'
import { ModeContext } from '../contexts/mode-context'


export default function useMode() {
  return useContext(ModeContext)
}