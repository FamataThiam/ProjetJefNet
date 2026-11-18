
export function messageErreur(erreur) {
  if (!erreur?.response) {
    return 'Impossible de joindre le serveur JefNet. Vérifiez votre connexion internet.'
  }
  const { status, data } = erreur.response
  if (status === 429) return 'Trop de tentatives. Patientez une minute avant de réessayer.'
  if (status >= 500) return 'Une erreur est survenue sur le serveur. Réessayez dans un instant.'
  return data?.message || 'Une erreur est survenue.'
}


export function erreursChamps(erreur) {
  const erreurs = erreur?.response?.data?.errors || {}
  return Object.fromEntries(Object.entries(erreurs).map(([champ, messages]) => [champ, messages[0]]))
}