<?php

namespace App\Services;

use App\Exceptions\ProfilProException;
use App\Models\CodeList;
use App\Models\Membre;
use App\Models\ProfilProfessionnel;
use App\Repositories\Contracts\ProfilProfessionnelRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;


class ProfilProService
{
  
    private const CHAMPS_MODIFIABLES = ['titre_professionnel', 'experience', 'biographie', 'linkedin', 'portfolio'];
    private const DOSSIER_JUSTIFICATIFS = 'justificatifs/prestataires';

    public function __construct(private ProfilProfessionnelRepositoryInterface $profils) {}

    public function devenirPrestataire(Membre $membre, array $donnees): ProfilProfessionnel
    {
        if ($this->profils->trouverParMembre($membre->id)) {
            throw ProfilProException::dejaPrestataire();
        }

        $profil = $this->profils->creer([
            'membre_id'               => $membre->id,
            'titre_professionnel'     => $donnees['titre_professionnel'],
            'experience'              => $donnees['experience'] ?? null,
            'biographie'              => $donnees['biographie'] ?? null,
            'linkedin'                => $donnees['linkedin'] ?? null,
            'portfolio'               => $donnees['portfolio'] ?? null,
            'rayon_intervention_id'   => $this->codeId('RayonIntervention', $donnees['rayon_intervention']),
            'statut_certification_id' => $this->codeId('StatutProfil', 'NON_CERTIFIE'),
            'note_moyenne'            => 0,
        ]);

        return $profil->load(['rayonIntervention', 'statutCertification']);
    }

    public function monProfil(Membre $membre): ProfilProfessionnel
    {
        return $this->charger($this->profilDe($membre));
    }

    public function modifierProfil(Membre $membre, array $donnees): ProfilProfessionnel
    {
        $profil = $this->profilDe($membre);

        
        $modifs = array_intersect_key($donnees, array_flip(self::CHAMPS_MODIFIABLES));

      
        if (array_key_exists('rayon_intervention', $donnees)) {
            $modifs['rayon_intervention_id'] = $this->codeId('RayonIntervention', $donnees['rayon_intervention']);
        }

        if ($modifs) {
            $this->profils->modifier($profil, $modifs);
        }

        return $this->charger($profil);
    }


        public function demanderCertification(Membre $membre, UploadedFile $justificatif): ProfilProfessionnel
    {
        $profil = $this->profilDe($membre)->load('statutCertification');

        
        match ($profil->statutCertification?->value) {
            'EN_ATTENTE' => throw ProfilProException::certificationEnCours(),
            'CERTIFIE'   => throw ProfilProException::dejaCertifie(),
            default      => null,
        };

        
        $ancien  = $profil->cv;
        $nouveau = $justificatif->store(self::DOSSIER_JUSTIFICATIFS, 'local');

                $this->profils->modifier($profil, [
            'cv'                        => $nouveau,
            'statut_certification_id'   => $this->codeId('StatutProfil', 'EN_ATTENTE'),
            'certification_demandee_le' => now(),
           
            'motif_refus'               => null,
            'certification_traitee_par' => null,
            'certification_traitee_le'  => null,
        ]);

        if ($ancien && $ancien !== $nouveau) {
            Storage::disk('local')->delete($ancien);
        }

        return $this->charger($profil);
    }


     public function desactiverProfil(Membre $membre): array
    {
        $profil = $this->profilDe($membre);

        $nombre = $this->profils->desactiverServices($profil);

        return [$this->charger($profil), $nombre];
    }

    
    private function profilDe(Membre $membre): ProfilProfessionnel
    {
        return $this->profils->trouverParMembre($membre->id)
            ?? throw ProfilProException::pasPrestataire();
    }

    private function charger(ProfilProfessionnel $profil): ProfilProfessionnel
    {
        return $profil->load(['rayonIntervention', 'statutCertification'])
            ->loadCount(['services as nombre_services_actifs' => fn ($q) => $q->where('est_actif', true)]);
    }

    
    private function codeId(string $type, string $value): int
    {
        return CodeList::where('type', $type)->where('value', $value)->value('id')
            ?? throw new RuntimeException("Valeur CodeList introuvable : {$type}/{$value}");
    }



}