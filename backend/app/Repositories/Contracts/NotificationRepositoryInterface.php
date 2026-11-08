<?php

namespace App\Repositories\Contracts;

use App\Models\Notification;

interface NotificationRepositoryInterface
{
    public function creer(array $donnees): Notification;
}