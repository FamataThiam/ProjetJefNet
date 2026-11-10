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

    public function pourMembre(int $membreId, bool $nonLuesSeulement = false, int $parPage = 15): LengthAwarePaginator
    {
        return Notification::query()
            ->where('membre_id', $membreId)
            ->when($nonLuesSeulement, fn ($q) => $q->where('est_lu', false))
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

    public function marquerLue(Notification $notification): Notification
    {
        if (! $notification->est_lu) {
            $notification->update(['est_lu' => true]);
        }

        return $notification;
    }

    public function toutMarquerLu(int $membreId): int
    {
        return Notification::query()
            ->where('membre_id', $membreId)
            ->where('est_lu', false)
            ->update(['est_lu' => true]);
    }
}