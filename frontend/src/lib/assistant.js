// Questions / réponses de JefIA, l'assistant du visiteur.
// Pour ajouter une question : copier un bloc, changer la question, les mots-clés et la réponse.
export const QUESTIONS = [
  {
    question: 'Comment trouver un prestataire ?',
    motsCles: ['trouver', 'chercher', 'recherche', 'prestataire', 'carte', 'proche', 'quartier', 'pres de chez'],
    reponse: 'Choisissez un métier et votre quartier dans la recherche, ou explorez la carte. Cliquez sur un prestataire pour voir sa fiche, puis son profil.',
    action: { libelle: 'Trouver un prestataire', vers: '/#trouver' },
  },
  {
    question: 'Comment réserver ?',
    motsCles: ['reserver', 'reservation', 'creneau', 'commander', 'rendez-vous', 'rdv'],
    reponse: 'Ouvrez le profil du prestataire, choisissez un service et un créneau, puis confirmez. Il faut avoir un compte pour réserver.',
    action: { libelle: "S'inscrire", vers: '/inscription' },
  },
  {
    question: 'Comment se passe le paiement ?',
    motsCles: ['payer', 'paiement', 'wave', 'orange money', 'carte bancaire', 'prix', 'facture', 'argent'],
    reponse: 'Le paiement se fait en ligne par Wave, Orange Money ou carte bancaire. Vous recevez ensuite votre facture.',
  },
  {
    question: "L'inscription est-elle gratuite ?",
    motsCles: ['gratuit', 'gratuite', 'inscription', 'inscrire', 'cout', 'payant', 'compte'],
    reponse: "Oui, créer un compte sur JefNet est gratuit.",
    action: { libelle: "S'inscrire", vers: '/inscription' },
  },
  {
    question: 'Comment devenir prestataire ?',
    motsCles: ['devenir', 'proposer', 'mes services', 'travailler', 'vitrine', 'professionnel', 'savoir-faire'],
    reponse: 'Créez un compte, complétez votre profil, puis créez votre profil professionnel avec vos services et vos réalisations.',
    action: { libelle: 'Devenir prestataire', vers: '/inscription' },
  },
  {
    question: 'Que veut dire le badge certifié ?',
    motsCles: ['certifie', 'certification', 'badge', 'verifie', 'confiance', 'justificatif'],
    reponse: "Le prestataire a envoyé ses justificatifs, et l'équipe JefNet les a vérifiés.",
  },
  {
    question: 'Comment voir les avis ?',
    motsCles: ['avis', 'note', 'etoile', 'commentaire', 'noter'],
    reponse: "Les avis et la note moyenne sont sur le profil de chaque prestataire. Seuls les clients qui ont réservé peuvent laisser un avis.",
    action: { libelle: 'Trouver un prestataire', vers: '/#trouver' },
  },
  {
    question: 'Puis-je parler au prestataire ?',
    motsCles: ['parler', 'ecrire', 'message', 'messagerie', 'contacter', 'appeler', 'appel', 'video', 'discuter'],
    reponse: "Oui. Une fois connecté, vous pouvez lui écrire et même l'appeler en vidéo depuis la messagerie, avant de réserver.",
    action: { libelle: 'Se connecter', vers: '/connexion' },
  },
  {
    question: 'Puis-je me connecter avec Google ?',
    motsCles: ['google', 'facebook', 'github', 'connecter', 'connexion', 'compte externe'],
    reponse: 'Oui, vous pouvez vous connecter avec Google, GitHub ou Facebook.',
    action: { libelle: 'Se connecter', vers: '/connexion' },
  },
  {
    question: "J'ai oublié mon mot de passe",
    motsCles: ['oublie', 'mot de passe', 'mdp', 'reinitialiser', 'code'],
    reponse: 'Cliquez sur « Mot de passe oublié » : vous recevrez un code par e-mail pour en choisir un nouveau.',
    action: { libelle: 'Mot de passe oublié', vers: '/mot-de-passe-oublie' },
  },
  // politesse (pas affichées dans la FAQ)
  {
    question: 'Bonjour',
    motsCles: ['bonjour', 'salut', 'bonsoir', 'hello', 'salam', 'nanga def'],
    reponse: 'Bonjour ! Posez-moi votre question, ou choisissez un sujet ci-dessous.',
    suggestions: true,
    politesse: true,
  },
  {
    question: 'Merci',
    motsCles: ['merci', 'jerejef', 'super', 'parfait'],
    reponse: 'Avec plaisir ! Je reste là si vous avez une autre question.',
    politesse: true,
  },
]

// Questions affichées en pastilles
export const SUGGESTIONS = QUESTIONS.slice(0, 4).map((q) => q.question)

export const ACCUEIL = 'Bonjour, je suis JefIA, l’assistant de JefNet. Que voulez-vous savoir ?'
export const INCOMPRIS = "Je n'ai pas bien compris. Voici ce que je peux vous expliquer :"

// minuscules, sans accents
const normaliser = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// Trouve la réponse qui a le plus de mots-clés en commun avec la question, ou null
export function trouverReponse(texte) {
  const t = normaliser(texte)
  const exacte = QUESTIONS.find((q) => normaliser(q.question) === t)
  if (exacte) return exacte

  let meilleure = null
  let score = 0
  for (const q of QUESTIONS) {
    const s = q.motsCles.filter((m) => t.includes(normaliser(m))).length
    if (s > score) { score = s; meilleure = q }
  }
  return meilleure
}