import { useMutation } from '@tanstack/react-query'
import api from './client'


export function useCompleterProfil() {
  return useMutation({
    mutationFn: ({ photo, ...champs }) => {
      const donnees = new FormData()
      Object.entries(champs).forEach(([cle, valeur]) => donnees.append(cle, valeur))
      if (photo) donnees.append('photo', photo)
      return api.post('/profil/completer', donnees).then((r) => r.data)
    },
  })
}