
const VIDEOS = ['coiffure', 'bricolage', 'couture', 'electricite', 'menage', 'menuiserie', 'peinture', 'traiteur']


const ALIAS = { plomberie: 'bricolage' }


export function slugDomaine(libelle = '') {
  return libelle.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/[^a-z]+/)[0]
}


export function videoDuDomaine(libelle) {
  const slug = slugDomaine(libelle)
  const nom = ALIAS[slug] ?? slug
  if (!VIDEOS.includes(nom)) return null
  return { src: `/videos/${nom}.mp4`, poster: `/videos/${nom}-poster.jpg` }
}