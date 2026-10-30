<?php

namespace Database\Seeders;

use App\Models\Membre;
use App\Models\RapportPrestation;
use App\Models\Reservation;
use App\Services\CodeListService;
use Database\Seeders\Concerns\TirageAleatoire;
use Database\Seeders\Data\SenegalData;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RapportPrestationSeeder extends Seeder
{
    use TirageAleatoire;

    public function __construct(private CodeListService $codeLists) {}

    public function run(): void
    {
        $terminee = $this->codeLists->idOf('StatutReservation', 'TERMINEE');

        $reservations = Reservation::with(['details.service.domaine', 'client.user', 'prestataire.membre.user'])
            ->where('statut_id', $terminee)
            ->get();

        foreach ($reservations as $reservation) {
            $estDemo = $reservation->client->user->email === 'client@jefnet.test';

            if (! $estDemo && fake()->boolean(15)) {
                continue;
            }

            $statut  = $estDemo ? 'SIGNE' : $this->tirage(['SIGNE' => 70, 'EN_ATTENTE_SIGNATURE' => 20, 'BROUILLON' => 10]);
            $domaine = $reservation->details->first()->service->domaine->libelle;

          
            $fin      = $reservation->date_prevue->copy()->setTimeFromTimeString($reservation->heure_prevue)->addHours(fake()->numberBetween(2, 5));
            $sigPresta = in_array($statut, ['SIGNE', 'EN_ATTENTE_SIGNATURE']) ? $fin->copy()->addMinutes(fake()->numberBetween(5, 40)) : null;
            $sigClient = $statut === 'SIGNE' ? $sigPresta->copy()->addMinutes(fake()->numberBetween(5, 180)) : null;

          
            if ($sigPresta) {
                $this->assurerSignature($reservation->prestataire->membre);
            }
            if ($sigClient) {
                $this->assurerSignature($reservation->client);
            }

            $rapport = RapportPrestation::create([
                'reservation_id'             => $reservation->id,
                'description_prestation'     => SenegalData::descriptionRapport($domaine),
                'observations'               => $statut === 'SIGNE' ? fake()->randomElement(SenegalData::OBSERVATIONS_CLIENT) : null,
                'photos_avant'               => null,
                'photos_apres'               => null,
                'date_signature_prestataire' => $sigPresta,
                'date_signature_client'      => $sigClient,
                'statut_rapport_id'          => $this->codeLists->idOf('StatutRapport', $statut),
                'fichier_pdf'                => null,   // sera généré par le service, après les deux signatures
            ]);

            $rapport->timestamps = false;
            $rapport->created_at = $fin;
            $rapport->updated_at = $sigClient ?? $sigPresta ?? $fin;
            $rapport->save();
        }
    }

    
    private function assurerSignature(Membre $membre): void
    {
        if (! $membre->signature_electronique) {
            $membre->update([
                'signature_electronique' => 'signatures/signature-' . Str::slug($membre->user->nom) . '.png',
            ]);
        }
    }
}