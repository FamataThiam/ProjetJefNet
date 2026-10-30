<?php

namespace Database\Factories;

use App\Models\Membre;
use App\Services\CodeListService;
use Database\Seeders\Data\SenegalData;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProfilProfessionnelFactory extends Factory
{
    public function definition(): array
    {
        $codeLists = app(CodeListService::class);
        $domaine   = fake()->randomElement(array_keys(SenegalData::METIERS));
        $titre     = SenegalData::titre($domaine, fake()->randomElement(['homme', 'femme']));
        $annees    = fake()->numberBetween(1, 20);

        return [
            'membre_id'               => Membre::factory(),
            'titre_professionnel'     => $titre,
            'experience'              => $annees . ' an' . ($annees > 1 ? 's' : '') . " d'expérience",
            'cv'                      => null,
            'linkedin'                => fake()->boolean(25) ? 'https://www.linkedin.com/in/' . fake()->userName() : null,
            'portfolio'               => null,
            'rayon_intervention_id'   => $codeLists->idOf('RayonIntervention', fake()->randomElement(['LOCALITE', 'VILLE', 'VILLE', 'REGION'])),
            'statut_certification_id' => $codeLists->idOf('StatutProfil', 'NON_CERTIFIE'),
            'note_moyenne'            => 0,
            'biographie'              => "$titre passionné(e) avec $annees an" . ($annees > 1 ? 's' : '') . " d'expérience. Travail soigné, ponctuel et à l'écoute des clients.",
        ];
    }


    public function dansDomaine(string $domaine, string $genre = 'homme'): static
    {
        return $this->state(fn () => [
            'titre_professionnel' => SenegalData::titre($domaine, $genre),
        ]);
    }

  
    public function certification(string $statut): static
    {
        return $this->state(fn () => [
            'statut_certification_id' => app(CodeListService::class)->idOf('StatutProfil', $statut),
        ]);
    }
}