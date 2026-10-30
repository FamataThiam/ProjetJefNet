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

    // Ville => quartiers / localités
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


        // Domaine => services possibles : [nom, prix min, prix max, durée en minutes, unité de tarif]
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

    // Retrouve le domaine à partir d'un titre, ex : "Tresseuse" → "Coiffure & beauté"
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
}