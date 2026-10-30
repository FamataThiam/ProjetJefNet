<?php

namespace Database\Seeders;

use App\Models\Domaine;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DomaineSeeder extends Seeder
{
    public function run(): void
    {
        $domaines = [
            'Coiffure & beauté' => 'Tresses, coiffures de cérémonie, maquillage, onglerie et soins à domicile ou en salon.',
            'Plomberie'         => 'Réparation de fuites, installation sanitaire, chauffe-eau et débouchage.',
            'Électricité'       => 'Dépannage, câblage, installation de prises, éclairage et climatisation.',
            'Couture'           => 'Tenues sur mesure, retouches et confection pour les fêtes et cérémonies.',
            'Peinture'          => 'Peinture intérieure et extérieure, façades et finitions décoratives.',
            'Menuiserie'        => 'Fabrication et réparation de meubles, portes, fenêtres et placards.',
            'Ménage'            => 'Nettoyage de maisons et bureaux, repassage et entretien régulier.',
            'Traiteur'          => 'Repas pour baptêmes, mariages, Tabaski et toutes les cérémonies.',
            'Maçonnerie'        => 'Construction, carrelage, rénovation et petits travaux de bâtiment.',
            'Mécanique'         => 'Entretien et réparation de voitures et de motos, à domicile ou en atelier.',
        ];

        foreach ($domaines as $libelle => $description) {
            // "Coiffure & beauté" → "coiffure.jpg", "Électricité" → "electricite.jpg"
            $fichier = Str::slug(explode(' ', $libelle)[0]) . '.jpg';

            Domaine::updateOrCreate(
                ['libelle' => $libelle],
                [
                    'description' => $description,
                    'image_path'  => "domaines/$fichier",
                ]
            );
        }
    }
}