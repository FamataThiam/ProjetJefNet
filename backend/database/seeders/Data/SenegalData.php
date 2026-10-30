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

    // Nombre de photos disponibles dans storage/app/public/avatars
    public const NB_AVATARS_FEMMES = 18;
    public const NB_AVATARS_HOMMES = 17;

    // Préfixes des numéros de téléphone sénégalais
    public const PREFIXES_TEL = ['77', '78', '76', '70', '75'];
}