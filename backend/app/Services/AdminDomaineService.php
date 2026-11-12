<?php

namespace App\Services;

use App\Exceptions\DomaineAdminException;
use App\Models\Domaine;
use App\Repositories\Contracts\DomaineAdminRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class AdminDomaineService
{
    private const DOSSIER_IMAGES = 'domaines';

    public function __construct(private DomaineAdminRepositoryInterface $domaines) {}



    public function lister(?string $etat, ?string $recherche): Collection
    {
        return $this->domaines->lister($etat, $recherche);
    }

    public function consulter(int $id): Domaine
    {
        return $this->domaines->trouver($id);
    }



    public function creer(array $donnees, ?UploadedFile $image): Domaine
    {
        $domaine = $this->domaines->creer([
            'libelle'     => $this->nettoyerLibelle($donnees['libelle']),
            'description' => $donnees['description'] ?? null,
            'image_path'  => $image?->store(self::DOSSIER_IMAGES, 'public'),
            'est_actif'   => true,
        ]);

        return $this->domaines->trouver($domaine->id);
    }

  

    public function modifier(int $id, array $donnees, ?UploadedFile $image, bool $supprimerImage = false): Domaine
    {
        $domaine = $this->domaines->trouver($id);
        $modifs  = [];

        if (array_key_exists('libelle', $donnees)) {
            $modifs['libelle'] = $this->nettoyerLibelle($donnees['libelle']);
        }
        if (array_key_exists('description', $donnees)) {
            $modifs['description'] = $donnees['description'];
        }

       
        $ancienneImage = $domaine->image_path;

        if ($image) {
            $modifs['image_path'] = $image->store(self::DOSSIER_IMAGES, 'public');
        } elseif ($supprimerImage) {
            $modifs['image_path'] = null;
        }

        if ($modifs) {
            $this->domaines->modifier($domaine, $modifs);
        }

      
        if (array_key_exists('image_path', $modifs) && $ancienneImage) {
            Storage::disk('public')->delete($ancienneImage);
        }

        return $this->domaines->trouver($id);
    }



    public function activer(int $id): Domaine
    {
        $domaine = $this->domaines->trouver($id);

        if ($domaine->est_actif) {
            throw DomaineAdminException::dejaActif();
        }

        $this->domaines->modifier($domaine, ['est_actif' => true]);

        return $this->domaines->trouver($id);
    }

    public function desactiver(int $id): Domaine
    {
        $domaine = $this->domaines->trouver($id);

        if (! $domaine->est_actif) {
            throw DomaineAdminException::dejaInactif();
        }

        
        $this->domaines->modifier($domaine, ['est_actif' => false]);

        return $this->domaines->trouver($id);
    }

    
    private function nettoyerLibelle(string $libelle): string
    {
        $libelle = preg_replace('/\s+/u', ' ', trim($libelle));

        return mb_strtoupper(mb_substr($libelle, 0, 1)) . mb_substr($libelle, 1);
    }
}