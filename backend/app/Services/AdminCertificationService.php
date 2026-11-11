<?php

namespace App\Services;

use App\Exceptions\CertificationException;
use App\Models\Administrateur;
use App\Models\ProfilProfessionnel;
use App\Repositories\Contracts\CertificationRepositoryInterface;
use App\Support\CodeListe;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class AdminCertificationService
{
    
    public const DUREE_LIEN_MINUTES = 10;

    public function __construct(
        private CertificationRepositoryInterface $certifications,
        private NotificationService $notifications,
    ) {}

  

    public function lister(?string $statut = 'EN_ATTENTE'): LengthAwarePaginator
    {
       
        return $this->certifications->lister($statut === 'TOUS' ? null : $statut);
    }

    public function consulter(int $profilId): ProfilProfessionnel
    {
        return $this->certifications->trouver($profilId);
    }


    public function lienJustificatif(int $profilId): array
    {
        $profil = $this->certifications->trouver($profilId);
        $this->cheminJustificatif($profil);   // vérifie que le fichier existe

        $expiration = now()->addMinutes(self::DUREE_LIEN_MINUTES);

        return [
            'url'       => URL::temporarySignedRoute('admin.certifications.justificatif', $expiration, ['id' => $profil->id]),
            'expire_le' => $expiration->toIso8601String(),
        ];
    }

   
    public function cheminJustificatif(ProfilProfessionnel|int $profil): string
    {
        $profil = is_int($profil) ? $this->certifications->trouver($profil) : $profil;

        if (! $profil->cv || ! Storage::disk('local')->exists($profil->cv)) {
            throw CertificationException::sansJustificatif();
        }

        return $profil->cv;
    }

   
    public function valider(Administrateur $admin, int $profilId): ProfilProfessionnel
    {
        $profil = $this->certifications->trouver($profilId);
        $this->exigerEnAttente($profil);

        DB::transaction(function () use ($profil, $admin) {
            $this->certifications->modifier($profil, [
                'statut_certification_id'   => CodeListe::id('StatutProfil', 'CERTIFIE'),
                'certification_traitee_par' => $admin->id,
                'certification_traitee_le'  => now(),
                'motif_refus'               => null,
            ]);

            $this->notifications->notifier(
                $profil->membre_id,
                'PROFIL',
                'Votre profil est certifié !',
                'Félicitations : votre profil professionnel est désormais certifié JefNet. '
                    . 'Le badge « Certifié » apparaît sur votre profil et améliore votre place dans les recommandations.',
                '/profil-pro',
            );
        });

        return $this->certifications->trouver($profilId);
    }

    

    public function refuser(Administrateur $admin, int $profilId, string $motif): ProfilProfessionnel
    {
        $profil = $this->certifications->trouver($profilId);
        $this->exigerEnAttente($profil);

        DB::transaction(function () use ($profil, $admin, $motif) {
            $this->certifications->modifier($profil, [
                'statut_certification_id'   => CodeListe::id('StatutProfil', 'REFUSE'),
                'certification_traitee_par' => $admin->id,
                'certification_traitee_le'  => now(),
                'motif_refus'               => $motif,
            ]);

            $this->notifications->notifier(
                $profil->membre_id,
                'PROFIL',
                'Demande de certification non acceptée',
                "Votre demande de certification n'a pas été acceptée. Motif : {$motif} "
                    . 'Vous pouvez envoyer un nouveau justificatif depuis votre profil professionnel.',
                '/profil-pro',
            );
        });

        return $this->certifications->trouver($profilId);
    }

   

    private function exigerEnAttente(ProfilProfessionnel $profil): void
    {
        $statut = $profil->statutCertification?->value;

        if ($statut !== 'EN_ATTENTE') {
            throw CertificationException::pasEnAttente((string) $statut);
        }
    }
}