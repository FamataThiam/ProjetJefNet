
const CLE = 'jefnet-jeton'

export function lireJeton() {
  try { return localStorage.getItem(CLE) } catch { return null }
}

export function enregistrerJeton(jeton) {
  try { localStorage.setItem(CLE, jeton) } catch { /* stockage indisponible */ }
}

export function effacerJeton() {
  try { localStorage.removeItem(CLE) } catch { /* stockage indisponible */ }
}