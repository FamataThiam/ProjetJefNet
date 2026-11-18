import senegal from './senegal.json'


export const CONTOUR_SENEGAL = senegal.contour
export const CONTOUR_GAMBIE = senegal.gambie

export const REGIONS = senegal.regions


export const VUE_DEPART = [[12.0, -18.1], [16.95, -11.2]]

export const LIMITES_MAX = [[11.2, -19.2], [17.8, -10.2]]


export const CENTRE_SENEGAL = { lat: 14.45, lng: -14.45 }
export const RAYON_SENEGAL_KM = 400

export const RAYON_PROCHE_KM = 10


export const ETIQUETTES = [
  { nom: 'Mauritanie', lat: 16.85, lng: -13.6 },
  { nom: 'Mali', lat: 15.3, lng: -11.75 },
  { nom: 'Guinée', lat: 12.15, lng: -12.6 },
  { nom: 'Guinée-Bissau', lat: 12.15, lng: -15.4 },
  { nom: 'Gambie', lat: 13.4, lng: -15.75, discret: true },
  { nom: 'Océan Atlantique', lat: 13.75, lng: -17.55, ocean: true },
]