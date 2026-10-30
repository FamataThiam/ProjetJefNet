<?php

namespace Database\Seeders;

use App\Models\Avis;
use App\Models\ProfilProfessionnel;
use App\Models\Reservation;
use App\Services\CodeListService;
use Database\Seeders\Concerns\TirageAleatoire;
use Illuminate\Database\Seeder;

class AvisSeeder extends Seeder
{
    use TirageAleatoire;

 
    private const COMMENTAIRES = [
        5 => [
            'Travail impeccable, ponctuel et très professionnel. Je recommande vivement !',
            'Excellent ! Le résultat a dépassé mes attentes. Merci beaucoup.',
            'Très satisfaite, travail propre et prix correct. Je ferai à nouveau appel à ce prestataire.',
            'Sérieux, rapide et à l\'écoute. Rien à redire.',
        ],
        4 => [
            'Bon travail dans l\'ensemble, juste un petit retard à l\'arrivée.',
            'Prestataire compétent et aimable. Résultat très correct.',
            'Satisfait du service, je recommande.',
        ],
        3 => [
            'Travail correct mais il a fallu repasser sur certains détails.',
            'Prestation moyenne, le délai annoncé n\'a pas été respecté.',
        ],
        2 => [
            'Déçu du résultat, le travail n\'était pas très soigné.',
            'Beaucoup de retard et peu de communication.',
        ],
        1 => [
            'Très mauvaise expérience, le problème n\'a pas été réglé.',
        ],
    ];

    public function __construct(private CodeListService $codeLists) {}

    public function run(): void
    {
        $terminee = $this->codeLists->idOf('StatutReservation', 'TERMINEE');

       
        $reservations = Reservation::with(['client.user', 'rapport'])->where('statut_id', $terminee)->get();

        foreach ($reservations as $reservation) {
            $estDemo = $reservation->client->user->email === 'client@jefnet.test';

            
            if (! $estDemo && ! fake()->boolean(65)) {
                continue;
            }

            $note = $estDemo ? 5 : (int) $this->tirage(['5' => 45, '4' => 35, '3' => 12, '2' => 5, '1' => 3]);

            
            $apres = $reservation->rapport?->date_signature_client ?? $reservation->date_prevue->copy()->setTime(20, 0);
            $date  = $apres->copy()->addHours(fake()->numberBetween(1, 72));

            $avis = Avis::create([
                'reservation_id' => $reservation->id,
                'note'           => $note,
                'commentaire'    => fake()->boolean(85) ? fake()->randomElement(self::COMMENTAIRES[$note]) : null,
            ]);

            $avis->timestamps = false;
            $avis->created_at = $date;
            $avis->updated_at = $date;
            $avis->save();
        }

        
        ProfilProfessionnel::all()->each->recalculerNoteMoyenne();
    }
}