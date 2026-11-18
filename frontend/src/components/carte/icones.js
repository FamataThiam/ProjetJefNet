import L from 'leaflet'


export function initiales(nom = '') {
  return nom.split(' ').filter(Boolean).slice(0, 2).map((m) => m[0].toUpperCase()).join('')
}


export function iconePrestataire({ nom, photo, actif = false, certifie = false }) {
  const taille = actif ? 52 : 38
  const contenu = photo
    ? `<img src="${encodeURI(photo)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />`
    : initiales(nom)
  return L.divIcon({
    className: '',
    html: `<span class="pastille-jef${actif ? ' pastille-active' : ''}${certifie ? ' pastille-certifiee' : ''}">${contenu}</span>`,
    iconSize: [taille, taille],
    iconAnchor: [taille / 2, taille / 2],
  })
}


export const iconeMoi = L.divIcon({
  className: '',
  html: '<span class="point-moi"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})


export function etiquette({ nom, ocean, discret }) {
  const classe = ocean ? 'etiquette-ocean' : discret ? 'etiquette-pays etiquette-discrete' : 'etiquette-pays'
  return L.divIcon({ className: classe, html: nom, iconSize: [160, 16], iconAnchor: [80, 8] })
}



export function etiquetteVille(nom) {
  return L.divIcon({ className: 'etiquette-ville', html: nom, iconSize: [120, 16], iconAnchor: [60, -14] })
}