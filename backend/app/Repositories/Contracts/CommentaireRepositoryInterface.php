<?php

namespace App\Repositories\Contracts;

use App\Models\CommentairePublication;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CommentaireRepositoryInterface
{
 
    public function pourPublication(int $publicationId, int $parPage = 10): LengthAwarePaginator;

    public function trouver(int $id): CommentairePublication;

    public function creer(array $donnees): CommentairePublication;

  
    public function supprimer(CommentairePublication $commentaire): void;
}