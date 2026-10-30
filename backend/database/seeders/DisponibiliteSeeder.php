<?php

namespace Database\Seeders;

use App\Models\Disponibilite;
use App\Models\ProfilProfessionnel;
use Illuminate\Database\Seeder;

class DisponibiliteSeeder extends Seeder
{
    
    private const FORMULES = [
        [['08:00', '12:00'], ['14:00', '18:00']],   
        [['09:00', '13:00']],                       
        [['14:00', '19:00']],                       
        [['08:00', '17:00']],                       
        [['10:00', '14:00'], ['16:00', '20:00']],   
    ];

    public function run(): void
    {
        foreach (ProfilProfessionnel::all() as $profil) {
            
            $joursTravailles = fake()->numberBetween(4, 6);

            for ($j = 0; $j < 14; $j++) {
                $jour = now()->addDays($j)->startOfDay();

                
                if ($jour->isSunday() && fake()->boolean(80)) {
                    continue;
                }
                if (! fake()->boolean($joursTravailles * 100 / 7)) {
                    continue;
                }

                foreach (fake()->randomElement(self::FORMULES) as [$debut, $fin]) {
                    Disponibilite::create([
                        'profil_professionnel_id' => $profil->id,
                        'jour_disponibilite'      => $jour->toDateString(),
                        'heure_debut'             => $debut,
                        'heure_fin'               => $fin,
                        
                        'est_disponible'          => fake()->boolean(80),
                    ]);
                }
            }
        }
    }
}