
const CLE = 'jefnet-jeton'

function lire(stockage) {
  try { return stockage.getItem(CLE) } catch { return null }
}

export function lireJeton() {
  return lire(localStorage) || lire(sessionStorage)
}

export function garderJeton(jeton, resterConnecte = true) {
  effacerJeton()
  try { (resterConnecte ? localStorage : sessionStorage).setItem(CLE, jeton) } catch { /* stockage indisponible */ }
}

export function effacerJeton() {
  try { localStorage.removeItem(CLE) } catch { /* rien */ }
  try { sessionStorage.removeItem(CLE) } catch { /* rien */ }
}