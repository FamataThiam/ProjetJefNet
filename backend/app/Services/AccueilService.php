<?php

namespace App\Services;

use App\Http\Resources\MembreResource;
use App\Models\Avis;
use App\Models\Media;
use App\Models\ProfilProfessionnel;
use App\Models\Publication;
use Illuminate\Support\Facades\Storage;

class AccueilService
{
   
    public function donnees(): array
    {
        return [
            'realisations' => $this->realisations(),
            'avis'         => $this->derniersAvis(),
            'chiffres'     => [
                'prestataires' => ProfilProfessionnel::count(),
                'avis'         => Avis::count(),
                'note_moyenne' => round((float) Avis::avg('note'), 1),
            ],
        ];
    }

   
    private function realisations(): array
    {
        return Publication::visibles()
            ->whereHas('medias', fn ($m) => $m->whereHas('type', fn ($t) => $t->where('value', 'IMAGE')), '>=', 2)
            ->with(['medias.type', 'prestataire.membre.user', 'prestataire.statutCertification'])
            ->latest('date_publication')
            ->limit(4)
            ->get()
            ->map(function (Publication $p) {
                $photos = $p->medias->filter(fn (Media $m) => $m->type?->value === 'IMAGE')->values();

                return [
                    'id'          => $p->id,
                    'titre'       => $p->titre,
                    'description' => $p->description,
                    'il_y_a'      => $p->date_publication?->diffForHumans(),
                    'avant'       => $this->url($photos[0]->url),
                    'apres'       => $this->url($photos[1]->url),
                    'prestataire' => $this->prestataire($p->prestataire),
                ];
            })
            ->all();
    }


    private function derniersAvis(): array
    {
        return Avis::where('note', 5)
            ->whereNotNull('commentaire')
            ->where('commentaire', '!=', '')
            ->with(['reservation.client.user', 'reservation.prestataire.membre.user'])
            ->latest()
            ->limit(3)
            ->get()
            ->map(fn (Avis $a) => [
                'id'          => $a->id,
                'note'        => $a->note,
                'commentaire' => $a->commentaire,
                'date'        => $a->created_at?->toDateString(),
                'auteur'      => $this->nomCourt($a->reservation?->client?->user),
                'prestataire' => $a->reservation?->prestataire
                    ? $this->prestataire($a->reservation->prestataire)
                    : null,
            ])
            ->all();
    }

    private function prestataire(ProfilProfessionnel $profil): array
    {
        $membre = $profil->membre;

        return [
            'id'       => $profil->id,
            'nom'      => trim("{$membre->user->prenom} {$membre->user->nom}"),
            'titre'    => $profil->titre_professionnel,
            'certifie' => $profil->statutCertification?->value === 'CERTIFIE',
          
            'membre'   => (new MembreResource($membre))->resolve(),
        ];
    }

    private function nomCourt($user): string
    {
        return $user ? trim($user->prenom . ' ' . mb_substr((string) $user->nom, 0, 1) . '.') : 'Client JefNet';
    }

    private function url(?string $chemin): ?string
    {
        if (! $chemin) {
            return null;
        }

        return str_starts_with($chemin, 'http') ? $chemin : Storage::disk('public')->url($chemin);
    }
}