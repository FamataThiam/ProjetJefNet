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
}