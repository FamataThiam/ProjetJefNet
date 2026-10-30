<?php

namespace Database\Seeders;

use App\Models\Facture;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Services\CodeListService;
use Carbon\Carbon;
use Database\Seeders\Concerns\TirageAleatoire;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PaiementSeeder extends Seeder
{
    use TirageAleatoire;

    public function __construct(private CodeListService $codeLists) {}

    public function run(): void
    {
        $reservations = Reservation::with(['statut', 'client.user'])->orderBy('created_at')->get();

        foreach ($reservations as $reservation) {
            $statut  = $reservation->statut->value;
            $estDemo = $reservation->client->user->email === 'client@jefnet.test';

            match ($statut) {
                'TERMINEE', 'EN_COURS' => $this->payer($reservation, avecEchec: ! $estDemo && fake()->boolean(20)),
                'CONFIRMEE' => $this->paiementConfirmee($reservation, $estDemo),
                'ANNULEE'   => fake()->boolean(20) ? $this->payer($reservation, rembourse: true) : null,
                default     => null,   
            };
        }

        $this->creerFactures();
    }

    private function paiementConfirmee(Reservation $reservation, bool $estDemo): void
    {
        $cas = $estDemo ? 'attente' : $this->tirage(['paye' => 60, 'attente' => 15, 'rien' => 25]);

        if ($cas === 'paye') {
            $this->payer($reservation);
        } elseif ($cas === 'attente') {
            $this->creerPaiement($reservation, 'EN_ATTENTE', $this->debut($reservation));
        }
    }

    
    private function payer(Reservation $reservation, bool $avecEchec = false, bool $rembourse = false): void
    {
        $date = $this->debut($reservation);

        if ($avecEchec) {
            $this->creerPaiement($reservation, 'ECHOUE', $date, 'MOBILE_MONEY');
            $date = $date->copy()->addMinutes(fake()->numberBetween(10, 120));
        }

        $this->creerPaiement($reservation, $rembourse ? 'REMBOURSEE' : 'PAYEE', $date);
    }

    private function creerPaiement(Reservation $reservation, string $statut, Carbon $date, ?string $mode = null): void
    {
        $mode ??= $this->tirage(['MOBILE_MONEY' => 60, 'CARTE' => 15, 'ESPECES' => 15, 'VIREMENT' => 10]);
        $abouti = in_array($statut, ['PAYEE', 'REMBOURSEE']);

        $paiement = new Paiement([
            'reservation_id'        => $reservation->id,
            'montant'               => $reservation->prix_final,
            'mode_id'               => $this->codeLists->idOf('ModePaiement', $mode),
            'statut_id'             => $this->codeLists->idOf('StatutPaiement', $statut),
            
            'reference_transaction' => $mode === 'ESPECES' ? null : 'TX-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4)),
            'date_paiement'         => $abouti ? $date->copy()->addMinutes(fake()->numberBetween(1, 5)) : null,
        ]);
        $paiement->timestamps = false;
        $paiement->created_at = $date;
        $paiement->updated_at = $date;
        $paiement->save();
    }

 
    private function debut(Reservation $reservation): Carbon
    {
        return ($reservation->date_confirmation ?? $reservation->created_at)
            ->copy()->addHours(fake()->numberBetween(1, 24));
    }

    
    private function creerFactures(): void
    {
        $abouti = [
            $this->codeLists->idOf('StatutPaiement', 'PAYEE'),
            $this->codeLists->idOf('StatutPaiement', 'REMBOURSEE'),
        ];

      
        $paiements = Paiement::whereIn('statut_id', $abouti)->orderBy('date_paiement')->get();

        foreach ($paiements as $paiement) {
            $facture = new Facture([
                'paiement_id'    => $paiement->id,
                'numero_facture' => Facture::prochainNumero($paiement->date_paiement->year),
                'date_emission'  => $paiement->date_paiement->toDateString(),
                'montant'        => $paiement->montant,
                'fichier_pdf'    => null,
            ]);
          
            $facture->timestamps = false;
            $facture->created_at = $paiement->date_paiement;
            $facture->updated_at = $paiement->date_paiement;
            $facture->save();
        }
    }
}