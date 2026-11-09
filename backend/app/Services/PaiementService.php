<?php

namespace App\Services;

use App\Exceptions\PaiementException;
use App\Exceptions\ProfilProException;
use App\Exceptions\ReservationException;
use App\Models\Facture;
use App\Models\Membre;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Repositories\Contracts\PaiementRepositoryInterface;
use App\Repositories\Contracts\ProfilProfessionnelRepositoryInterface;
use App\Repositories\Contracts\ReservationRepositoryInterface;
use App\Support\CodeListe;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PaiementService
{
    private const DOSSIER_FACTURES = 'factures';

   
    private const PREFIXES = [
        'WAVE'         => 'WAVE',
        'ORANGE_MONEY' => 'OM',
        'FREE_MONEY'   => 'FREE',
        'CARTE'        => 'CARTE',
        'ESPECES'      => 'CASH',
    ];

    public function __construct(
        private PaiementRepositoryInterface $paiements,
        private ReservationRepositoryInterface $reservations,
        private ProfilProfessionnelRepositoryInterface $profils,
        private NotificationService $notifications,
    ) {}

    

    public function payer(Membre $client, string $uuid, array $donnees): Paiement
    {
       
        $reservation = $this->reservations->trouverPourParticipant($uuid, $client->id, null);

        if ($reservation->statut->value !== 'TERMINEE') {
            throw PaiementException::pasTerminee($reservation->statut->value);
        }

        $this->verifierAucunPaiementActif($reservation);

        $mode      = $donnees['mode'];
        $operateur = $donnees['operateur'] ?? null;

       
        if ($mode === 'ESPECES') {
            $paiement = $this->paiements->creer([
                'reservation_id'        => $reservation->id,
                'montant'               => $reservation->prix_final,
                'mode_id'               => CodeListe::id('ModePaiement', 'ESPECES'),
                'statut_id'             => CodeListe::id('StatutPaiement', 'EN_ATTENTE'),
                'reference_transaction' => $this->reference('ESPECES'),
            ]);

            $this->notifications->notifier(
                $reservation->prestataire->membre_id,
                'PAIEMENT',
                'Paiement en espèces à confirmer',
                "{$this->nomCourt($client)} indique vous avoir payé {$this->fcfa($reservation->prix_final)} en espèces. "
                    . 'Confirmez la réception pour générer la facture.',
                "/reservations/{$reservation->uuid}",
            );

            return $this->charger($paiement, $reservation);
        }

        
        $echec = $mode === 'MOBILE_MONEY' && str_ends_with($donnees['telephone'], '0000');

        if ($echec) {
            $paiement = $this->paiements->creer([
                'reservation_id'        => $reservation->id,
                'montant'               => $reservation->prix_final,
                'mode_id'               => CodeListe::id('ModePaiement', $mode),
                'statut_id'             => CodeListe::id('StatutPaiement', 'ECHOUE'),
                'reference_transaction' => $this->reference($operateur),
            ]);

            return $this->charger($paiement, $reservation);
        }

        $paiement = DB::transaction(function () use ($reservation, $mode, $operateur, $client) {
            $paiement = $this->paiements->creer([
                'reservation_id'        => $reservation->id,
                'montant'               => $reservation->prix_final,
                'mode_id'               => CodeListe::id('ModePaiement', $mode),
                'statut_id'             => CodeListe::id('StatutPaiement', 'PAYEE'),
                'reference_transaction' => $this->reference($mode === 'CARTE' ? 'CARTE' : $operateur),
                'date_paiement'         => now(),
            ]);

            $this->genererFacture($paiement, $reservation);

            $this->notifications->notifier(
                $reservation->prestataire->membre_id,
                'PAIEMENT',
                'Paiement reçu',
                "{$this->nomCourt($client)} a payé {$this->fcfa($reservation->prix_final)} pour la réservation {$this->quand($reservation)}.",
                "/reservations/{$reservation->uuid}",
            );

            return $paiement;
        });

        return $this->charger($paiement, $reservation);
    }

    

    public function confirmerEspeces(Membre $membre, string $uuid): Paiement
    {
        $profil = $this->profils->trouverParMembre($membre->id) ?? throw ProfilProException::pasPrestataire();
        $reservation = $this->reservations->trouverPourPrestataire($uuid, $profil->id);

        $paiement = $this->paiements->actif($reservation->id);

        if (! $paiement || $paiement->statut->value !== 'EN_ATTENTE' || $paiement->mode->value !== 'ESPECES') {
            throw PaiementException::aucunEspecesAConfirmer();
        }

        DB::transaction(function () use ($paiement, $reservation) {
            $this->paiements->modifier($paiement, [
                'statut_id'     => CodeListe::id('StatutPaiement', 'PAYEE'),
                'date_paiement' => now(),
            ]);

            $this->genererFacture($paiement, $reservation);

            $this->notifications->notifier(
                $reservation->membre_id,
                'PAIEMENT',
                'Paiement confirmé',
                "{$this->nomCourt($reservation->prestataire->membre)} a confirmé la réception de votre paiement en espèces "
                    . "({$this->fcfa($reservation->prix_final)}). Votre facture est disponible.",
                "/reservations/{$reservation->uuid}",
            );
        });

        return $this->charger($paiement, $reservation);
    }

   

    public function historique(Membre $membre, string $uuid): Collection
    {
        $reservation = $this->reservationVisible($membre, $uuid);

        return $this->paiements->pourReservation($reservation->id)
            ->each(fn (Paiement $p) => $p->setRelation('reservation', $reservation));
    }

    

    /** @return array{0: string, 1: string} [chemin sur le disque privé, nom du fichier] */
    public function facture(Membre $membre, string $uuid): array
    {
        $reservation = $this->reservationVisible($membre, $uuid);

        $paiement = $this->paiements->pourReservation($reservation->id)
            ->first(fn (Paiement $p) => $p->statut->value === 'PAYEE' && $p->facture);

        if (! $paiement) {
            throw PaiementException::pasDeFacture();
        }

        $facture = $paiement->facture;

     
        if (! $facture->fichier_pdf || ! Storage::disk('local')->exists($facture->fichier_pdf)) {
            $this->ecrirePdf($facture, $paiement, $reservation);
        }

        return [$facture->fichier_pdf, "Facture-{$facture->numero_facture}.pdf"];
    }

    

    private function verifierAucunPaiementActif(Reservation $reservation): void
    {
        $actif = $this->paiements->actif($reservation->id);

        if ($actif?->statut->value === 'PAYEE') {
            throw PaiementException::dejaPayee();
        }

        if ($actif?->statut->value === 'EN_ATTENTE') {
            throw PaiementException::especesEnAttente();
        }
    }

    private function reservationVisible(Membre $membre, string $uuid): Reservation
    {
        $profilId = $this->profils->trouverParMembre($membre->id)?->id;

        return $this->reservations->trouverPourParticipant($uuid, $membre->id, $profilId);
    }

    private function genererFacture(Paiement $paiement, Reservation $reservation): Facture
    {
        $numero = Facture::prochainNumero((int) now()->format('Y'));

        $facture = $this->paiements->creerFacture($paiement, [
            'numero_facture' => $numero,
            'date_emission'  => today(),
            'montant'        => $paiement->montant,
            'fichier_pdf'    => self::DOSSIER_FACTURES . "/{$numero}.pdf",
        ]);

        $this->ecrirePdf($facture, $paiement, $reservation);

        return $facture;
    }

    private function ecrirePdf(Facture $facture, Paiement $paiement, Reservation $reservation): void
    {
        $paiement->refresh()->load(['mode']);
        $reservation->loadMissing(['details.service', 'client.user', 'prestataire.membre.user', 'prestataire.statutCertification', 'rapport']);

        $pdf = Pdf::loadView('pdf.facture', [
            'facture'        => $facture,
            'paiement'       => $paiement,
            'reservation'    => $reservation,
            'mode'           => $this->libelleMode($paiement),
            'montantLettres' => $this->enLettres($facture->montant),
        ])->setPaper('a4')->setOption('isFontSubsettingEnabled', true);

        $chemin = $facture->fichier_pdf ?: self::DOSSIER_FACTURES . "/{$facture->numero_facture}.pdf";
        Storage::disk('local')->put($chemin, $pdf->output());
    }

    private function charger(Paiement $paiement, Reservation $reservation): Paiement
    {
        return $paiement->load(['mode', 'statut', 'facture'])->setRelation('reservation', $reservation);
    }

  
    private function reference(?string $moyen): string
    {
        $prefixe = self::PREFIXES[$moyen] ?? 'PAY';

        return $prefixe . '-' . now()->format('Ymd') . '-' . Str::upper(Str::random(6));
    }

    private function libelleMode(Paiement $paiement): string
    {
        $prefixe = Str::before((string) $paiement->reference_transaction, '-');

        return match ($paiement->mode->value) {
            'MOBILE_MONEY' => 'Mobile Money (' . (['WAVE' => 'Wave', 'OM' => 'Orange Money', 'FREE' => 'Free Money'][$prefixe] ?? 'opérateur') . ')',
            'CARTE'        => 'Carte bancaire',
            'ESPECES'      => 'Espèces',
            default        => $paiement->mode->value,
        };
    }

   
    private function enLettres($montant): ?string
    {
        if (! class_exists(\NumberFormatter::class)) {
            return null;
        }

        return (new \NumberFormatter('fr', \NumberFormatter::SPELLOUT))->format((int) $montant);
    }

    private function nomCourt(Membre $membre): string
    {
        return "{$membre->user->prenom} " . mb_substr($membre->user->nom, 0, 1) . '.';
    }

    private function fcfa($montant): string
    {
        return number_format((float) $montant, 0, ',', ' ') . ' F';
    }

    private function quand(Reservation $reservation): string
    {
        return 'du ' . $reservation->date_prevue->format('d/m/Y') . ' à ' . substr((string) $reservation->heure_prevue, 0, 5);
    }
}