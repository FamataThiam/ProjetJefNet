<?php

namespace App\Repositories\Eloquent;

use App\Models\Notification;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class NotificationRepository implements NotificationRepositoryInterface
{
    public function creer(array $donnees): Notification
    {
        return Notification::create($donnees);
    }

    public function pourMembre(int $membreId, array $filtres = [], int $parPage = 20): LengthAwarePaginator
    {
        $etat  = $filtres['etat'] ?? 'toutes';
        $type  = $filtres['type'] ?? null;
        $texte = $filtres['q'] ?? null;

        return Notification::query()
            ->where('membre_id', $membreId)
            ->when($etat === 'non_lues', fn ($q) => $q->where('est_lu', false))
            ->when($etat === 'lues', fn ($q) => $q->where('est_lu', true))
            ->when($type, fn ($q) => $q->whereHas('type', fn ($t) => $t->where('value', $type)))
            ->when($texte, function ($q) use ($texte) {
                $motif = '%' . addcslashes($texte, '%_\\') . '%';
                $q->where(fn ($w) => $w->where('titre', 'ilike', $motif)->orWhere('contenu', 'ilike', $motif));
            })
            ->with('type')
            ->latest('id')
            ->paginate($parPage)
            ->withQueryString();
    }

    public function trouverPourMembre(int $membreId, int $id): Notification
    {
        return Notification::query()
            ->where('membre_id', $membreId)
            ->with('type')
            ->findOrFail($id);
    }

    public function nombreNonLues(int $membreId): int
    {
        return Notification::where('membre_id', $membreId)->where('est_lu', false)->count();
    }

    public function compteParType(int $membreId): array
    {
        return Notification::query()
            ->join('code_lists', 'code_lists.id', '=', 'notifications.type_id')
            ->where('notifications.membre_id', $membreId)
            ->groupBy('code_lists.value')
            ->selectRaw('code_lists.value as type, count(*) as total, sum(case when notifications.est_lu then 0 else 1 end) as non_lues')
            ->get()
            ->mapWithKeys(fn ($l) => [$l->type => ['total' => (int) $l->total, 'non_lues' => (int) $l->non_lues]])
            ->all();
    }

    public function marquerLue(Notification $notification): Notification
    {
        if (! $notification->est_lu) {
            $notification->update(['est_lu' => true]);
        }

        return $notification;
    }

    public function marquerNonLue(Notification $notification): Notification
    {
        if ($notification->est_lu) {
            $notification->update(['est_lu' => false]);
        }

        return $notification;
    }

    public function marquerPlusieursLues(int $membreId, array $ids): int
    {
        return Notification::query()
            ->where('membre_id', $membreId)
            ->whereIn('id', $ids)
            ->where('est_lu', false)
            ->update(['est_lu' => true]);
    }

    public function toutMarquerLu(int $membreId): int
    {
        return Notification::query()
            ->where('membre_id', $membreId)
            ->where('est_lu', false)
            ->update(['est_lu' => true]);
    }
}