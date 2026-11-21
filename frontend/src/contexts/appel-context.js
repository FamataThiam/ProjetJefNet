import { createContext, useContext } from 'react'

export const AppelContext = createContext({ appeler: () => {}, enAppel: false })
export const useAppel = () => useContext(AppelContext)