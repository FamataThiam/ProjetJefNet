<?php

namespace App\Repositories\Contracts;

use App\Models\ProfilProfessionnel;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ProfilProfessionnelRepositoryInterface
{
    public function rechercher(array $filtres, int $parPage = 12): LengthAwarePaginator;

    public function trouverVisible(int $id): ProfilProfessionnel;
}