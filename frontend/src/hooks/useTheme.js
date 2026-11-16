import { useContext } from 'react'
import { ThemeContext } from '../contexts/theme-context'

export default function useTheme() {
  return useContext(ThemeContext)
}