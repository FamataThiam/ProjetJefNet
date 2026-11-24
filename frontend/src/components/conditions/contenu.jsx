

export const SECTIONS = [
  {
    id: 'a-propos',
    titre: 'À propos de JefNet',
    corps: (
      <>
        <p>JefNet met en relation des particuliers avec des prestataires de services du Sénégal : plomberie, électricité, ménage, éducation et bien d'autres domaines. Un client peut réserver directement un prestataire ou publier une demande à laquelle les prestataires proches répondent.</p>
        <p>JefNet n'est pas l'employeur des prestataires. La prestation est un accord entre le client et le prestataire ; JefNet fournit l'outil qui permet de se trouver, de s'organiser et de garder une trace de chaque étape.</p>
      </>
    ),
  },
  {
    id: 'compte',
    titre: 'Ton compte',
    corps: (
      <>
        <p>Pour réserver ou proposer un service, tu dois créer un compte avec des informations exactes. Tu es responsable de ton mot de passe et de tout ce qui est fait depuis ton compte.</p>
        <ul>
          <li>Un seul compte par personne.</li>
          <li>Le nom, le téléphone et la localité doivent être les tiens.</li>
          <li>Un compte peut être suspendu en cas de fraude, de faux justificatif ou de comportement irrespectueux. Le motif t'est alors communiqué.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'certification',
    titre: 'Prestataires et certification',
    corps: (
      <>
        <p>Tout membre peut devenir prestataire en renseignant son métier, ses services, ses tarifs et sa zone d'intervention. Le prestataire s'engage à proposer des tarifs honnêtes et à respecter les disponibilités qu'il affiche.</p>
        <p>Le badge « Certifié » est attribué après la vérification d'un justificatif (diplôme, attestation, carte professionnelle) par l'équipe JefNet. Une demande peut être refusée avec un motif, et le badge peut être retiré si les informations ne sont plus valables.</p>
        <div className="cg-encadre">Le badge atteste que le justificatif a été vérifié. Il ne garantit pas, à lui seul, le résultat d'une prestation.</div>
      </>
    ),
  },
  {
    id: 'reservations',
    titre: 'Réservations et paiements',
    corps: (
      <>
        <ul>
          <li>Le prestataire accepte ou refuse chaque réservation. Une demande publiée sans réponse expire au bout de 7 jours.</li>
          <li>Le client ou le prestataire peut annuler une réservation, avec un motif, tant que la prestation n'a pas commencé.</li>
          <li>À la fin, le prestataire rédige un rapport (avec photos avant et après) que les deux parties signent.</li>
          <li>Le paiement se fait après la signature du rapport, selon le mode choisi. Une facture est alors générée.</li>
        </ul>
        <div className="cg-encadre">Le prix affiché dans la réservation est celui sur lequel client et prestataire se sont mis d'accord. Toute modification doit être convenue entre eux avant la prestation.</div>
      </>
    ),
  },
  {
    id: 'publications',
    titre: 'Avis et publications',
    corps: (
      <>
        <p>Après une prestation payée, le client peut laisser un avis. Les prestataires peuvent publier leurs réalisations, et les membres peuvent les commenter.</p>
        <p>Sont interdits : les propos injurieux, discriminatoires ou mensongers, les contenus qui ne sont pas les tiens, les coordonnées publiées pour contourner la plateforme et la publicité sans rapport avec un service. L'équipe de modération peut masquer une publication ou supprimer un commentaire ; l'auteur en est informé.</p>
      </>
    ),
  },
  {
    id: 'responsabilites',
    titre: 'Responsabilités',
    corps: (
      <>
        <p>Chaque prestataire est responsable de la qualité et de la sécurité de son travail. Chaque client est responsable des informations qu'il donne (adresse, description du besoin) et du paiement convenu.</p>
        <p>JefNet fait son possible pour que la plateforme reste disponible et fiable, mais ne peut être tenu responsable d'un litige né de l'exécution d'une prestation. En cas de problème, les messages, le rapport signé et la facture servent de traces.</p>
      </>
    ),
  },
  {
    id: 'confidentialite',
    titre: 'Confidentialité',
    separe: true,
    corps: (
      <>
        <p>Nous collectons uniquement les données nécessaires au service :</p>
        <ul>
          <li><b>Compte</b> : nom, adresse e-mail, téléphone, photo, ville et localité.</li>
          <li><b>Position</b> : seulement si tu l'autorises, pour trouver des prestataires ou des demandes proches.</li>
          <li><b>Prestataires</b> : métier, services, disponibilités et justificatif de certification. Le justificatif n'est visible que par l'équipe JefNet.</li>
          <li><b>Activité</b> : réservations, messages, rapports, paiements et avis.</li>
        </ul>
        <p>Ces données ne servent qu'au fonctionnement de JefNet : elles ne sont ni vendues ni cédées à des tiers.</p>
        <div className="cg-encadre">Conformément à la loi sénégalaise n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel, tu peux demander l'accès, la rectification ou la suppression de tes données en contactant l'équipe JefNet.</div>
      </>
    ),
  },
]

export const FAQ = [
  ['Comment réserver un prestataire ?', 'Ouvre son profil, clique sur « Réserver », choisis un ou plusieurs services, un jour et un créneau parmi ses disponibilités, puis envoie la réservation.'],
  ['Je ne trouve pas le bon prestataire, que faire ?', 'Publie une demande depuis « Demandes » : les prestataires du domaine qui interviennent dans ta zone la verront et pourront l\'accepter.'],
  ['Comment devenir prestataire ?', 'Depuis le fil, clique sur « Devenir prestataire » et remplis ton métier, tes services et ta zone. Tu pourras ensuite demander la certification depuis ton espace.'],
  ['Pourquoi mon compte est-il suspendu ?', 'Une suspension fait suite à un signalement ou au non-respect de ces conditions. Le motif t\'a été envoyé ; contacte l\'équipe JefNet pour en discuter.'],
  ['Comment supprimer mes données ?', 'Écris à l\'équipe JefNet depuis l\'adresse e-mail de ton compte. La demande est traitée conformément à la section Confidentialité.'],
]