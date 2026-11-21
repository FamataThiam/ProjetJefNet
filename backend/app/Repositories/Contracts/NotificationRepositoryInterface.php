<?php

namespace App\Repositories\Contracts;

use App\Models\Notification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface NotificationRepositoryInterface
{
    public function creer(array $donnees): Notification;


    public function pourMembre(int $membreId, array $filtres = [], int $parPage = 20): LengthAwarePaginator;

    public function trouverPourMembre(int $membreId, int $id): Notification;

    public function nombreNonLues(int $membreId): int;

   
    public function compteParType(int $membreId): array;

    public function marquerLue(Notification $notification): Notification;

    public function marquerNonLue(Notification $notification): Notification;

  
    public function marquerPlusieursLues(int $membreId, array $ids): int;

    public function toutMarquerLu(int $membreId): int;
}