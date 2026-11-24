export function accueilDe(user) {
  if (!user) return '/connexion'
  if (user.est_administrateur) return '/admin'
  if (!user.profil_complete) return '/completer-profil'
  return '/fil' 
}


export function suiteSure(valeur) {
  return valeur && valeur.startsWith('/') && !valeur.startsWith('//') ? valeur : null
}

// la suite n'est gardée que si elle est dans le bon espace :
// un administrateur reste dans /admin, un membre n'y entre pas
function suitePour(user, suite) {
  if (!suite) return null
  const versAdmin = suite === '/admin' || suite.startsWith('/admin/')
  return Boolean(user?.est_administrateur) === versAdmin ? suite : null
}

export function apresConnexion(user, suiteDemandee) {
  const suite = suitePour(user, suiteDemandee)
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