<?php

namespace Database\Seeders\Data;

class SenegalData
{
    public const PRENOMS_FEMMES = [
        'Fatou', 'Awa', 'Aminata', 'Mariama', 'Khady', 'Ndèye', 'Adama', 'Coumba',
        'Astou', 'Bineta', 'Fatoumata', 'Aïssatou', 'Rokhaya', 'Seynabou', 'Dieynaba',
        'Maimouna', 'Sokhna', 'Yacine', 'Marème', 'Ramatoulaye',
    ];

    public const PRENOMS_HOMMES = [
        'Moussa', 'Ibrahima', 'Cheikh', 'Ousmane', 'Mamadou', 'Abdoulaye', 'Modou',
        'Pape', 'Serigne', 'Babacar', 'Alioune', 'Lamine', 'Malick', 'Saliou',
        'Amadou', 'Omar', 'Assane', 'Elhadji', 'Souleymane', 'Idrissa',
    ];

    // Ces 25 noms correspondent exactement aux fichiers signature-xxx.png
    public const NOMS = [
        'Diop', 'Ndiaye', 'Fall', 'Sow', 'Ba', 'Diallo', 'Sy', 'Faye', 'Gueye',
        'Thiam', 'Mbaye', 'Sarr', 'Diouf', 'Cissé', 'Kane', 'Seck', 'Ndour',
        'Badji', 'Camara', 'Touré', 'Niang', 'Mbengue', 'Wade', 'Samb', 'Dieng',
    ];

    
    public const VILLES = [
        'Dakar'       => ['Médina', 'Plateau', 'Parcelles Assainies', 'Liberté 6', 'Sacré-Cœur', 'Ouakam', 'Grand Yoff', 'HLM', 'Point E', 'Almadies'],
        'Pikine'      => ['Thiaroye', 'Guinaw Rails', 'Keur Massar', 'Dalifort'],
        'Guédiawaye'  => ['Golf Sud', 'Sam Notaire', 'Wakhinane'],
        'Rufisque'    => ['Keur Ndiaye Lô', 'Diokoul', 'Bargny'],
        'Thiès'       => ['Thiès Nord', 'Randoulène', 'Médina Fall'],
        'Saint-Louis' => ['Sor', 'Guet Ndar', 'Ndar Toute'],
        'Touba'       => ['Darou Marnane', 'Ndamatou', 'Gouye Mbind'],
        'Kaolack'     => ['Médina Baye', 'Kasnack', 'Léona'],
        'Mbour'       => ['Saly', 'Grand Mbour', 'Tefess'],
        'Ziguinchor'  => ['Boucotte', 'Lyndiane', 'Tilène'],
    ];

    
    public const NB_AVATARS_FEMMES = 18;
    public const NB_AVATARS_HOMMES = 17;

  
    public const PREFIXES_TEL = ['77', '78', '76', '70', '75'];


    
    public const METIERS = [
        'Coiffure & beauté' => [['Coiffeur', 'Coiffeuse'], ['Tresseur', 'Tresseuse'], ['Maquilleur professionnel', 'Maquilleuse professionnelle'], ['Esthéticien', 'Esthéticienne']],
        'Plomberie'         => [['Plombier', 'Plombière'], ['Plombier sanitaire', 'Plombière sanitaire']],
        'Électricité'       => [['Électricien', 'Électricienne'], ['Électricien bâtiment', 'Électricienne bâtiment'], ['Frigoriste', 'Frigoriste']],
        'Couture'           => [['Tailleur', 'Couturière'], ['Couturier', 'Couturière'], ['Styliste couturier', 'Styliste couturière']],
        'Peinture'          => [['Peintre en bâtiment', 'Peintre en bâtiment'], ['Peintre décorateur', 'Peintre décoratrice']],
        'Menuiserie'        => [['Menuisier', 'Menuisière'], ['Menuisier ébéniste', 'Menuisière ébéniste']],
        'Ménage'            => [['Agent d\'entretien', 'Agente d\'entretien'], ['Aide ménager', 'Aide ménagère']],
        'Traiteur'          => [['Traiteur', 'Traiteur'], ['Cuisinier événementiel', 'Cuisinière événementielle']],
        'Maçonnerie'        => [['Maçon', 'Maçonne'], ['Carreleur', 'Carreleuse']],
        'Mécanique'         => [['Mécanicien auto', 'Mécanicienne auto'], ['Mécanicien moto', 'Mécanicienne moto']],
    ];

    
    public static function genreDe(string $prenom): string
    {
        return in_array($prenom, self::PRENOMS_FEMMES) ? 'femme' : 'homme';
    }

   
    public static function titre(string $domaine, string $genre): string
    {
        $paire = self::METIERS[$domaine][array_rand(self::METIERS[$domaine])];
        return $genre === 'femme' ? $paire[1] : $paire[0];
    }


        
    public const CATALOGUE = [
        'Coiffure & beauté' => [
            ['Tresses africaines', 10000, 25000, 240, 'forfait'],
            ['Nattes simples', 3000, 7000, 90, 'forfait'],
            ['Coiffure de mariage', 25000, 60000, 180, 'forfait'],
            ['Maquillage de cérémonie', 15000, 35000, 90, 'forfait'],
            ['Pose d\'ongles', 5000, 12000, 60, 'forfait'],
        ],
        'Plomberie' => [
            ['Réparation de fuite', 5000, 15000, 60, 'forfait'],
            ['Débouchage de canalisation', 7500, 20000, 90, 'forfait'],
            ['Installation de chauffe-eau', 15000, 35000, 180, 'forfait'],
            ['Pose de robinetterie', 5000, 12000, 60, 'forfait'],
        ],
        'Électricité' => [
            ['Dépannage électrique', 5000, 15000, 60, 'forfait'],
            ['Installation de prise ou interrupteur', 2500, 6000, 30, 'par unité'],
            ['Installation de climatiseur', 25000, 50000, 180, 'forfait'],
            ['Entretien de climatiseur', 10000, 20000, 90, 'forfait'],
        ],
        'Couture' => [
            ['Grand boubou sur mesure', 15000, 50000, 4320, 'forfait'],
            ['Tenue de Tabaski', 20000, 60000, 4320, 'forfait'],
            ['Robe de cérémonie', 20000, 70000, 4320, 'forfait'],
            ['Retouche', 1500, 5000, 60, 'par pièce'],
        ],
        'Peinture' => [
            ['Peinture d\'une chambre', 30000, 80000, 480, 'forfait'],
            ['Peinture intérieure', 1500, 3000, 60, 'par m²'],
            ['Peinture de façade', 150000, 400000, 2880, 'forfait'],
        ],
        'Menuiserie' => [
            ['Placard sur mesure', 80000, 250000, 2880, 'forfait'],
            ['Lit sur mesure', 120000, 300000, 4320, 'forfait'],
            ['Réparation de porte', 5000, 15000, 120, 'forfait'],
        ],
        'Ménage' => [
            ['Ménage complet de maison', 10000, 25000, 240, 'forfait'],
            ['Repassage', 3000, 8000, 120, 'par séance'],
            ['Nettoyage de bureaux', 15000, 40000, 240, 'forfait'],
        ],
        'Traiteur' => [
            ['Repas de cérémonie', 2500, 6000, 1440, 'par personne'],
            ['Thiéboudienne pour 20 personnes', 25000, 50000, 480, 'forfait'],
            ['Buffet de mariage', 4000, 10000, 1440, 'par personne'],
        ],
        'Maçonnerie' => [
            ['Pose de carrelage', 3000, 6000, 60, 'par m²'],
            ['Construction de mur', 50000, 200000, 2880, 'forfait'],
            ['Petite rénovation', 25000, 100000, 1440, 'forfait'],
        ],
        'Mécanique' => [
            ['Vidange', 10000, 20000, 60, 'forfait'],
            ['Diagnostic', 5000, 10000, 45, 'forfait'],
            ['Réparation des freins', 15000, 35000, 120, 'forfait'],
            ['Entretien de moto', 5000, 12000, 60, 'forfait'],
        ],
    ];


    public static function domaineDuTitre(string $titre): ?string
    {
        foreach (self::METIERS as $domaine => $paires) {
            foreach ($paires as $paire) {
                if (in_array($titre, $paire)) {
                    return $domaine;
                }
            }
        }
        return null;
    }


        // Coordonnées GPS approximatives du centre de chaque quartier [latitude, longitude]
    public const COORDONNEES = [
        'Médina' => [14.6837, -17.4467], 'Plateau' => [14.6680, -17.4320], 'Parcelles Assainies' => [14.7639, -17.4417],
        'Liberté 6' => [14.7270, -17.4600], 'Sacré-Cœur' => [14.7205, -17.4690], 'Ouakam' => [14.7240, -17.4900],
        'Grand Yoff' => [14.7420, -17.4520], 'HLM' => [14.7110, -17.4450], 'Point E' => [14.6950, -17.4640],
        'Almadies' => [14.7440, -17.5150],
        'Thiaroye' => [14.7470, -17.3800], 'Guinaw Rails' => [14.7420, -17.4000], 'Keur Massar' => [14.7830, -17.3150], 'Dalifort' => [14.7330, -17.4180],
        'Golf Sud' => [14.7760, -17.3900], 'Sam Notaire' => [14.7880, -17.3980], 'Wakhinane' => [14.7800, -17.4050],
        'Keur Ndiaye Lô' => [14.7350, -17.2600], 'Diokoul' => [14.7160, -17.2780], 'Bargny' => [14.6960, -17.2280],
        'Thiès Nord' => [14.8000, -16.9300], 'Randoulène' => [14.7850, -16.9200], 'Médina Fall' => [14.7950, -16.9400],
        'Sor' => [16.0270, -16.4950], 'Guet Ndar' => [16.0280, -16.5110], 'Ndar Toute' => [16.0350, -16.5050],
        'Darou Marnane' => [14.8650, -15.8800], 'Ndamatou' => [14.8600, -15.8700], 'Gouye Mbind' => [14.8550, -15.8850],
        'Médina Baye' => [14.1550, -16.0850], 'Kasnack' => [14.1450, -16.0750], 'Léona' => [14.1400, -16.0700],
        'Saly' => [14.4470, -17.0130], 'Grand Mbour' => [14.4170, -16.9650], 'Tefess' => [14.4230, -16.9700],
        'Boucotte' => [12.5750, -16.2750], 'Lyndiane' => [12.5600, -16.2600], 'Tilène' => [12.5800, -16.2700],
    ];

 
    public const DEMANDES = [
        'Coiffure & beauté' => [
            ['Tresses pour un baptême samedi', 'Je cherche une tresseuse disponible à domicile ce week-end pour des tresses longues.'],
            ['Maquillage pour un mariage', 'Maquillage de la mariée et de deux demoiselles d\'honneur, le matin de la cérémonie.'],
        ],
        'Plomberie' => [
            ['Fuite d\'eau sous l\'évier', 'L\'eau coule sous l\'évier de la cuisine depuis ce matin, intervention urgente souhaitée.'],
            ['Chauffe-eau en panne', 'Le chauffe-eau ne chauffe plus, il faut le réparer ou le remplacer.'],
        ],
        'Électricité' => [
            ['Coupure de courant dans une chambre', 'Plus d\'électricité dans une chambre, le disjoncteur saute dès qu\'on rallume.'],
            ['Installation de deux climatiseurs', 'Achat de deux climatiseurs, besoin d\'un professionnel pour l\'installation.'],
        ],
        'Couture' => [
            ['Tenues de Tabaski pour la famille', 'Confection de quatre tenues (deux adultes, deux enfants), tissu déjà acheté.'],
            ['Retouches de pantalons', 'Trois pantalons à raccourcir et un boubou à ajuster.'],
        ],
        'Peinture' => [
            ['Repeindre un salon', 'Salon d\'environ 25 m² à repeindre, murs et plafond.'],
            ['Peinture de la façade', 'Façade de la maison à rafraîchir avant la saison des pluies.'],
        ],
        'Menuiserie' => [
            ['Porte qui ferme mal', 'La porte d\'entrée frotte et ne ferme plus correctement.'],
            ['Placard pour une chambre', 'Fabrication d\'un placard deux portes sur mesure.'],
        ],
        'Ménage' => [
            ['Grand ménage avant un événement', 'Nettoyage complet de la maison avant une cérémonie familiale.'],
            ['Repassage chaque semaine', 'Recherche d\'une personne pour le repassage une fois par semaine.'],
        ],
        'Traiteur' => [
            ['Repas pour un baptême (50 personnes)', 'Thiéboudienne et yassa pour environ 50 invités.'],
            ['Buffet pour une fête d\'anniversaire', 'Buffet salé et sucré pour 30 personnes, samedi soir.'],
        ],
        'Maçonnerie' => [
            ['Carrelage d\'une cuisine', 'Pose de carrelage au sol, environ 12 m², carreaux déjà achetés.'],
            ['Réparation d\'un mur fissuré', 'Un mur extérieur présente des fissures, besoin d\'un diagnostic et d\'une réparation.'],
        ],
        'Mécanique' => [
            ['Voiture qui ne démarre plus', 'La voiture ne démarre plus depuis hier, mécanicien à domicile souhaité.'],
            ['Vidange et révision', 'Vidange et contrôle général d\'une voiture avant un long trajet.'],
        ],
    ];



        // Domaine => [diagnostic, travaux réalisés, matériel utilisé, recommandations]
    public const RAPPORTS = [
        'Coiffure & beauté' => [
            'Cheveux secs avec des pointes abîmées. La cliente souhaitait une coiffure tenant trois à quatre semaines.',
            'Lavage et démêlage, application d\'un soin hydratant, puis réalisation de la coiffure demandée, section par section. Finition avec une huile légère.',
            'Mèches synthétiques fournies par la cliente, peigne à queue, élastiques, huile de coco et spray hydratant.',
            'Hydrater le cuir chevelu deux fois par semaine et dormir avec un foulard en satin pour faire durer la coiffure.',
        ],
        'Plomberie' => [
            'Fuite constatée au niveau du raccord sous l\'évier, causée par un joint usé. Légère baisse de pression dans la cuisine.',
            'Coupure de l\'arrivée d\'eau, démontage du siphon, remplacement du joint et du raccord défectueux, nettoyage de la canalisation, puis remise en eau et contrôle de l\'étanchéité.',
            'Joints neufs, raccord en laiton, ruban téflon, clé à molette et pince multiprise.',
            'Ne pas verser d\'huile de cuisson dans l\'évier et vérifier l\'absence de fuite dans une semaine.',
        ],
        'Électricité' => [
            'Le disjoncteur de la chambre sautait à chaque remise en marche, à cause d\'une prise endommagée et d\'un câble chauffé.',
            'Mise hors tension du circuit, remplacement de la prise et du câble abîmé, contrôle des connexions du tableau, puis test de chaque point lumineux et de chaque prise.',
            'Prise murale, câble 2,5 mm², domino de connexion, multimètre et tournevis isolés.',
            'Éviter les multiprises en cascade et faire contrôler l\'installation électrique tous les deux ans.',
        ],
        'Couture' => [
            'Prise des mesures et choix du modèle avec le client. Tissu fourni de bonne qualité, en quantité suffisante.',
            'Coupe du tissu selon les mesures, assemblage, broderie du col, pose des finitions puis essayage et retouches finales.',
            'Machine à coudre, fil assorti, fil à broder, boutons et thermocollant.',
            'Laver à l\'eau froide et repasser à l\'envers pour préserver les couleurs et la broderie.',
        ],
        'Peinture' => [
            'Murs présentant des traces d\'humidité légères et une peinture écaillée par endroits. Surface d\'environ 25 m².',
            'Protection du sol et des meubles, ponçage, application d\'une sous-couche, puis de deux couches de peinture. Nettoyage du chantier en fin d\'intervention.',
            'Peinture acrylique lavable, sous-couche, rouleaux, pinceaux, bâches et ruban de masquage.',
            'Aérer la pièce pendant 48 heures et attendre deux semaines avant de laver les murs.',
        ],
        'Menuiserie' => [
            'Porte frottant au sol et charnières desserrées, rendant la fermeture difficile.',
            'Dépose de la porte, rabotage du bas, renforcement et resserrage des charnières, réglage de la serrure, puis repose et vérification de la fermeture.',
            'Rabot, vis à bois, charnières neuves, perceuse et vernis de protection.',
            'Graisser les charnières tous les six mois et éviter de claquer la porte.',
        ],
        'Ménage' => [
            'Logement de quatre pièces à nettoyer entièrement avant un événement familial.',
            'Dépoussiérage complet, nettoyage des sols, de la cuisine et des sanitaires, lavage des vitres et rangement des pièces de vie.',
            'Produits d\'entretien, serpillières, balais, éponges et chiffons microfibres.',
            'Prévoir un entretien régulier chaque semaine pour faciliter les prochains nettoyages.',
        ],
        'Traiteur' => [
            'Repas commandé pour une cérémonie familiale, avec un menu choisi à l\'avance avec le client.',
            'Préparation des plats le matin même, cuisson, dressage dans les plats de service, livraison sur place et installation du buffet.',
            'Marmites, réchauds, plats de service, ustensiles et ingrédients frais du marché.',
            'Consommer les restes dans les 24 heures et les conserver au frais.',
        ],
        'Maçonnerie' => [
            'Sol irrégulier à préparer avant la pose de carrelage. Surface d\'environ 12 m².',
            'Préparation et nivellement de la surface, traçage, pose du carrelage au mortier-colle, puis réalisation des joints et nettoyage.',
            'Mortier-colle, croisillons, niveau à bulle, coupe-carreaux et joint de carrelage.',
            'Ne pas marcher sur le sol pendant 24 heures et attendre 48 heures avant de le laver.',
        ],
        'Mécanique' => [
            'Le véhicule présentait un bruit au freinage et une huile moteur usée.',
            'Vidange du moteur, remplacement du filtre à huile, contrôle et remplacement des plaquettes de frein, puis essai sur route.',
            'Huile moteur, filtre à huile, plaquettes de frein, cric et clés.',
            'Prévoir la prochaine vidange dans 5 000 km et faire vérifier les pneus régulièrement.',
        ],
    ];

    // Observations possibles du client, à la fin du rapport
    public const OBSERVATIONS_CLIENT = [
        'Intervention réalisée à l\'heure prévue. Travail propre et soigné. Aucune réserve.',
        'Prestataire ponctuel et à l\'écoute. Je suis satisfaite du résultat.',
        'Très bon travail, le prestataire a bien expliqué ce qu\'il a fait. Aucune réserve.',
        'Léger retard à l\'arrivée, mais le travail est de qualité. Aucune réserve.',
        'Résultat conforme à ce qui était demandé. Je recommande.',
    ];

    // Assemble les 4 paragraphes du rapport (séparés par une ligne vide)
    public static function descriptionRapport(string $domaine): string
    {
        [$diagnostic, $travaux, $materiel, $recommandations] = self::RAPPORTS[$domaine];

        return "Diagnostic. $diagnostic\n\n"
             . "Travaux réalisés. $travaux\n\n"
             . "Matériel utilisé. $materiel\n\n"
             . "Recommandations. $recommandations";
    }
}