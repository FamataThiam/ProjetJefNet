<?php

namespace App\Repositories\Eloquent;

use App\Models\ProfilProfessionnel;
use App\Repositories\Contracts\ProfilProfessionnelRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ProfilProfessionnelRepository implements ProfilProfessionnelRepositoryInterface
{

    private function visibles(): Builder
    {
        return ProfilProfessionnel::query()
            ->whereHas('membre.user.statutCompte', fn ($q) => $q->where('value', 'ACTIF'))
            ->whereHas('services', fn ($q) => $q->where('est_actif', true));
    }

    public function rechercher(array $filtres, int $parPage = 12): LengthAwarePaginator
    {
        $servicesActifs = fn ($q) => $q->where('est_actif', true);

        $query = $this->visibles();

        
        if (! empty($filtres['domaine'])) {
            $query->whereHas('services', fn ($q) => $q
                ->where('est_actif', true)
                ->where('domaine_id', $filtres['domaine']));
        }

        
        if (! empty($filtres['ville'])) {
            $query->whereHas('membre', fn ($q) => $q->where('ville', 'ILIKE', $filtres['ville']));
        }

      
        if (isset($filtres['note_min'])) {
            $query->where('note_moyenne', '>=', $filtres['note_min']);
        }

       
        if (! empty($filtres['certifie'])) {
            $query->whereHas('statutCertification', fn ($q) => $q->where('value', 'CERTIFIE'));
        }

       
        if (! empty($filtres['q'])) {
            $like = '%' . addcslashes($filtres['q'], '%_\\') . '%';

            $query->where(function ($q) use ($like) {
                $q->where('titre_professionnel', 'ILIKE', $like)
                  ->orWhereHas('services', fn ($s) => $s->where('est_actif', true)->where('nom', 'ILIKE', $like))
                  ->orWhereHas('membre.user', fn ($u) => $u->where('prenom', 'ILIKE', $like)->orWhere('nom', 'ILIKE', $like));
            });
        }

      
        $query->with([
                'membre.user',
                'statutCertification',
                'services' => fn ($q) => $q->where('est_actif', true)->with('domaine'),
            ])
            ->withMin(['services as prix_min' => $servicesActifs], 'prix')
            ->withCount('avis as nombre_avis');

       
        match ($filtres['tri'] ?? 'note') {
            'prix'  => $query->orderBy('prix_min')->orderByDesc('note_moyenne'),
            'avis'  => $query->orderByDesc('nombre_avis')->orderByDesc('note_moyenne'),
            default => $query->orderByDesc('note_moyenne')->orderByDesc('nombre_avis'),
        };
        $query->orderBy('id');   // ordre stable d'une page à l'autre

        return $query->paginate($parPage)->withQueryString();
    }

 
    public function trouverVisible(int $id): ProfilProfessionnel
    {
        return $this->visibles()
            ->with([
                'membre.user',
                'statutCertification',
                'rayonIntervention',

               
                'services' => fn ($q) => $q->where('est_actif', true)
                    ->with('domaine')
                    ->orderBy('prix'),

                
                'disponibilites' => fn ($q) => $q->where('est_disponible', true)
                    ->whereDate('jour_disponibilite', '>=', today())
                    ->orderBy('jour_disponibilite')
                    ->orderBy('heure_debut')
                    ->limit(30),

                
                'avis' => fn ($q) => $q->with('reservation.membre.user')
                    ->orderByDesc('avis.created_at')
                    ->limit(10),
            ])
            ->withMin(['services as prix_min' => fn ($q) => $q->where('est_actif', true)], 'prix')
            ->withCount('avis as nombre_avis')
            ->findOrFail($id);
    }



        public function trouverParMembre(int $membreId): ?ProfilProfessionnel
    {
        return ProfilProfessionnel::where('membre_id', $membreId)->first();
    }

    public function creer(array $donnees): ProfilProfessionnel
    {
        return ProfilProfessionnel::create($donnees);
    }



        public function modifier(ProfilProfessionnel $profil, array $donnees): ProfilProfessionnel
    {
        $profil->update($donnees);

        return $profil;
    }


     public function desactiverServices(ProfilProfessionnel $profil): int
    {
        return $profil->services()->where('est_actif', true)->update(['est_actif' => false]);
    }
}
