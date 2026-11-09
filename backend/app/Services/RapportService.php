<?php

namespace App\Services;

use App\Exceptions\ProfilProException;
use App\Exceptions\RapportException;
use App\Models\Membre;
use App\Models\ProfilProfessionnel;
use App\Models\RapportPrestation;
use App\Models\Reservation;
use App\Repositories\Contracts\ProfilProfessionnelRepositoryInterface;
use App\Repositories\Contracts\RapportRepositoryInterface;
use App\Repositories\Contracts\ReservationRepositoryInterface;
use App\Support\CodeListe;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RapportService
{
    private const DOSSIER = 'rapports';

    public function __construct(
        private RapportRepositoryInterface $rapports,
        private ReservationRepositoryInterface $reservations,
        private ProfilProfessionnelRepositoryInterface $profils,
        private NotificationService $notifications,
    ) {}

    /* =========================================================
     |  1. RÉDIGER (prestataire) — le prestataire signe en même temps
     * ========================================================= */

    public function rediger(Membre $membre, string $uuid, array $donnees): RapportPrestation
    {
        $reservation = $this->reservations->trouverPourPrestataire($uuid, $this->profilDe($membre)->id);

        if ($reservation->statut->value !== 'TERMINEE') {
            throw RapportException::prestationNonTerminee($reservation->statut->value);
        }

        if ($this->rapports->pourReservation($reservation->id)) {
            throw RapportException::dejaRedige();
        }

                
        $this->enregistrerSignature($membre, $donnees['signature'] ?? null);
        $this->exigerSignature($membre);

        $rapport = $this->rapports->creer([
            'reservation_id'             => $reservation->id,
            'description_prestation'     => $donnees['description_prestation'],
            'observations'               => $donnees['observations'] ?? null,
            'photos_avant'               => $this->stockerPhoto($reservation, $donnees['photo_avant'] ?? null, 'avant'),
            'photos_apres'               => $this->stockerPhoto($reservation, $donnees['photo_apres'] ?? null, 'apres'),
            'date_signature_prestataire' => now(),
            'statut_rapport_id'          => CodeListe::id('StatutRapport', 'EN_ATTENTE_SIGNATURE'),
        ]);

        $this->notifications->notifier(
            $reservation->membre_id,
            'RESERVATION',
            'Rapport de prestation à signer',
            "{$this->nomCourt($membre)} a rédigé le rapport de la prestation {$this->quand($reservation)}. "
                . 'Consultez-le et signez-le pour confirmer que le travail a été réalisé.',
            "/reservations/{$reservation->uuid}",
        );

        return $this->charger($rapport, $reservation);
    }

    /* =========================================================
     |  2. MODIFIER (prestataire) — tant que le client n'a pas signé
     * ========================================================= */

    public function modifier(Membre $membre, string $uuid, array $donnees): RapportPrestation
    {
        $reservation = $this->reservations->trouverPourPrestataire($uuid, $this->profilDe($membre)->id);
        $rapport     = $this->rapportDe($reservation);

        if ($rapport->date_signature_client) {
            throw RapportException::dejaSigne();
        }

        $champs = array_intersect_key($donnees, array_flip(['description_prestation', 'observations']));

        // Une nouvelle photo remplace l'ancienne (qui est supprimée du disque)
        foreach (['avant' => 'photos_avant', 'apres' => 'photos_apres'] as $moment => $colonne) {
            if (! empty($donnees["photo_{$moment}"])) {
                $this->supprimerFichier($rapport->{$colonne});
                $champs[$colonne] = $this->stockerPhoto($reservation, $donnees["photo_{$moment}"], $moment);
            }
        }

        // Le prestataire re-signe la nouvelle version
        $champs['date_signature_prestataire'] = now();

        $this->rapports->modifier($rapport, $champs);

        $this->notifications->notifier(
            $reservation->membre_id,
            'RESERVATION',
            'Rapport de prestation mis à jour',
            "{$this->nomCourt($membre)} a modifié le rapport de la prestation {$this->quand($reservation)}. Relisez-le avant de le signer.",
            "/reservations/{$reservation->uuid}",
        );

        return $this->charger($rapport, $reservation);
    }

    /* =========================================================
     |  3. CONSULTER (client ou prestataire)
     * ========================================================= */

    public function consulter(Membre $membre, string $uuid): RapportPrestation
    {
        $reservation = $this->reservationVisible($membre, $uuid);

        return $this->charger($this->rapportDe($reservation), $reservation);
    }

    /** Chemin (disque privé) de la photo « avant » ou « après ». */
    public function photo(Membre $membre, string $uuid, string $moment): string
    {
        $rapport = $this->rapportDe($this->reservationVisible($membre, $uuid));
        $chemin  = $moment === 'avant' ? $rapport->photos_avant : $rapport->photos_apres;

        if (! $chemin || ! Storage::disk('local')->exists($chemin)) {
            throw RapportException::introuvable();
        }

        return $chemin;
    }

    /* =========================================================
     |  4. SIGNER (client) — le rapport est ensuite verrouillé
     * ========================================================= */

        public function signer(Membre $client, string $uuid, ?string $signature = null): RapportPrestation
    {
        // Seul le client de la réservation peut signer
        $reservation = $this->reservations->trouverPourParticipant($uuid, $client->id, null);
        $rapport     = $this->rapportDe($reservation);

        if ($rapport->date_signature_client) {
            throw RapportException::dejaSigne();
        }

        $this->enregistrerSignature($client, $signature);
        $this->exigerSignature($client);

        DB::transaction(function () use ($rapport, $reservation, $client) {
            $this->rapports->modifier($rapport, [
                'date_signature_client' => now(),
                'statut_rapport_id'     => CodeListe::id('StatutRapport', 'SIGNE'),
                'fichier_pdf'           => self::DOSSIER . "/{$reservation->uuid}/rapport.pdf",
            ]);

            $this->ecrirePdf($rapport->refresh(), $reservation);

            $this->notifications->notifier(
                $reservation->prestataire->membre_id,
                'RESERVATION',
                'Rapport signé par le client',
                "{$this->nomCourt($client)} a signé le rapport de la prestation {$this->quand($reservation)}.",
                "/reservations/{$reservation->uuid}",
            );
        });

        return $this->charger($rapport, $reservation);
    }

    /* =========================================================
     |  5. TÉLÉCHARGER LE PDF (client ou prestataire)
     * ========================================================= */

    /** @return array{0: string, 1: string} [contenu PDF, nom du fichier] */
    public function pdf(Membre $membre, string $uuid): array
    {
        $reservation = $this->reservationVisible($membre, $uuid);
        $rapport     = $this->rapportDe($reservation);
        $nom         = "Rapport-{$rapport->numero()}.pdf";

        // Rapport signé : on sert le fichier archivé (régénéré s'il a disparu)
        if ($rapport->estSigneParLesDeux()) {
            if (! $rapport->fichier_pdf || ! Storage::disk('local')->exists($rapport->fichier_pdf)) {
                $this->ecrirePdf($rapport, $reservation);
            }

            return [Storage::disk('local')->get($rapport->fichier_pdf), $nom];
        }

        // Pas encore signé : aperçu généré à la volée, non archivé
        return [$this->genererPdf($rapport, $reservation), $nom];
    }

    /* =========================================================
     |  OUTILS INTERNES
     * ========================================================= */

    private function profilDe(Membre $membre): ProfilProfessionnel
    {
        return $this->profils->trouverParMembre($membre->id)
            ?? throw ProfilProException::pasPrestataire();
    }

    private function reservationVisible(Membre $membre, string $uuid): Reservation
    {
        $profilId = $this->profils->trouverParMembre($membre->id)?->id;

        return $this->reservations->trouverPourParticipant($uuid, $membre->id, $profilId);
    }

    private function rapportDe(Reservation $reservation): RapportPrestation
    {
        return $this->rapports->pourReservation($reservation->id)
            ?? throw RapportException::introuvable();
    }


        /** Enregistre la signature dessinée (image PNG en base64) dans le profil du membre. */
    private function enregistrerSignature(Membre $membre, ?string $dataUrl): void
    {
        if (! $dataUrl) {
            return;
        }

        $image = base64_decode(Str::after($dataUrl, 'base64,'), true);

        // On vérifie que c'est bien une vraie image PNG (signature des fichiers PNG)
        if ($image === false || ! str_starts_with($image, "\x89PNG")) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'signature' => 'La signature envoyée n\'est pas une image valide.',
            ]);
        }

        // L'ancienne signature est remplacée
        if ($ancienne = $this->cheminSignature($membre)) {
            Storage::disk('public')->delete($ancienne);
        }

        $chemin = 'signatures/' . $membre->id . '-' . Str::random(12) . '.png';
        Storage::disk('public')->put($chemin, $image);

        $membre->forceFill(['signature_electronique' => $chemin])->save();
    }

    private function exigerSignature(Membre $membre): void
    {
        if (! $this->cheminSignature($membre)) {
            throw RapportException::signatureManquante();
        }
    }

    /** La colonne peut contenir un chemin (« signatures/x.png ») ou une URL (…/storage/signatures/x.png). */
    private function cheminSignature(Membre $membre): ?string
    {
        $valeur = $membre->signature_electronique;

        if (! $valeur) {
            return null;
        }

        $chemin = str_contains($valeur, '/storage/') ? Str::after($valeur, '/storage/') : $valeur;

        return Storage::disk('public')->exists($chemin) ? $chemin : null;
    }

    private function stockerPhoto(Reservation $reservation, ?UploadedFile $fichier, string $moment): ?string
    {
        if (! $fichier) {
            return null;
        }

        $nom = $moment . '-' . Str::random(10) . '.' . $fichier->extension();

        return $fichier->storeAs(self::DOSSIER . "/{$reservation->uuid}", $nom, 'local');
    }

    private function supprimerFichier(?string $chemin): void
    {
        if ($chemin) {
            Storage::disk('local')->delete($chemin);
        }
    }

    private function ecrirePdf(RapportPrestation $rapport, Reservation $reservation): void
    {
        Storage::disk('local')->put(
            $rapport->fichier_pdf ?: self::DOSSIER . "/{$reservation->uuid}/rapport.pdf",
            $this->genererPdf($rapport, $reservation),
        );
    }

    private function genererPdf(RapportPrestation $rapport, Reservation $reservation): string
    {
        $reservation->loadMissing([
            'details.service', 'demande', 'client.user',
            'prestataire.membre.user', 'prestataire.statutCertification',
            'paiements.mode', 'paiements.statut', 'paiements.facture',
        ]);

        return Pdf::loadView('pdf.rapport', [
            'rapport'              => $rapport,
            'reservation'          => $reservation,
            'photoAvant'           => $this->enImage('local', $rapport->photos_avant, true),
            'photoApres'           => $this->enImage('local', $rapport->photos_apres, true),
            'signaturePrestataire' => $rapport->date_signature_prestataire
                ? $this->enImage('public', $this->cheminSignature($reservation->prestataire->membre)) : null,
            'signatureClient'      => $rapport->date_signature_client
                ? $this->enImage('public', $this->cheminSignature($reservation->client)) : null,
        ])->setPaper('a4')->setOption('isFontSubsettingEnabled', true)->output();
    }

       /** Transforme une image du disque en « data URI », intégrée directement dans le PDF. */
    private function enImage(string $disque, ?string $chemin, bool $reduire = false): ?string
    {
        if (! $chemin || ! Storage::disk($disque)->exists($chemin)) {
            return null;
        }

        $contenu = Storage::disk($disque)->get($chemin);
        $type    = Storage::disk($disque)->mimeType($chemin);

        // Photos : réduites à 900 px max et converties en JPEG (PDF léger et rapide à générer)
        if ($reduire && function_exists('imagecreatefromstring') && ($source = @imagecreatefromstring($contenu))) {
            $largeur = imagesx($source);
            $hauteur = imagesy($source);
            $ratio   = min(1, 900 / max($largeur, $hauteur));
            $l = (int) round($largeur * $ratio);
            $h = (int) round($hauteur * $ratio);

            $image = imagecreatetruecolor($l, $h);
            imagefill($image, 0, 0, imagecolorallocate($image, 255, 255, 255));
            imagecopyresampled($image, $source, 0, 0, 0, 0, $l, $h, $largeur, $hauteur);

            ob_start();
            imagejpeg($image, null, 80);
            $contenu = ob_get_clean();
            $type    = 'image/jpeg';

            imagedestroy($source);
            imagedestroy($image);
        }

        return "data:{$type};base64," . base64_encode($contenu);
    }

    private function charger(RapportPrestation $rapport, Reservation $reservation): RapportPrestation
    {
        return $rapport->load('statut')->setRelation('reservation', $reservation);
    }

    private function nomCourt(Membre $membre): string
    {
        return "{$membre->user->prenom} " . mb_substr($membre->user->nom, 0, 1) . '.';
    }

    private function quand(Reservation $reservation): string
    {
        return 'du ' . $reservation->date_prevue->format('d/m/Y');
    }
}