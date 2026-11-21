
export function accueilDe(user) {
  if (!user) return '/connexion'
  if (user.est_administrateur) return '/admin'
  if (!user.profil_complete) return '/completer-profil'
  return '/fil' 
}


export function suiteSure(valeur) {
  return valeur && valeur.startsWith('/') && !valeur.startsWith('//') ? valeur : null
}

export function apresConnexion(user, suite) {
  if (user && !user.est_administrateur && !user.profil_complete) {
    return suite ? `/completer-profil?suite=${encodeURIComponent(suite)}` : '/completer-profil'
  }
  return suite || accueilDe(user)
}


const CLE_SUITE = 'jefnet-suite'
export function garderSuite(suite) {
  try { suite ? sessionStorage.setItem(CLE_SUITE, suite) : sessionStorage.removeItem(CLE_SUITE) } catch { /* rien */ }
}
export function reprendreSuite() {
  try {
    const s = sessionStorage.getItem(CLE_SUITE)
    sessionStorage.removeItem(CLE_SUITE)
    return suiteSure(s)
  } catch { return null }
}