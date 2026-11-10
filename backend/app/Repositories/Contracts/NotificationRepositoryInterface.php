<?php

namespace App\Repositories\Contracts;

use App\Models\Notification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface NotificationRepositoryInterface
{
    public function creer(array $donnees): Notification;

   
    public function pourMembre(int $membreId, bool $nonLuesSeulement = false, int $parPage = 15): LengthAwarePaginator;

  
    public function trouverPourMembre(int $membreId, int $id): Notification;

    public function nombreNonLues(int $membreId): int;

    public function marquerLue(Notification $notification): Notification;


    public function toutMarquerLu(int $membreId): int;
}