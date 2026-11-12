<?php

namespace App\Repositories\Contracts;

use App\Models\Media;
use App\Models\Publication;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface PublicationRepositoryInterface
{
    public function creer(array $donnees): Publication;

    public function ajouterMedia(Publication $publication, array $donnees): Media;

    public function modifier(Publication $publication, array $donnees): Publication;

    public function supprimer(Publication $publication): void;

 
    public function trouverVisible(int $id): Publication;

   
    public function trouverPourPrestataire(int $id, int $profilId): Publication;


    public function trouver(int $id): Publication;

    public function duPrestataire(int $profilId, bool $inclureMasquees, int $parPage = 10): LengthAwarePaginator;

  
    public function fil(array $c, int $parPage = 10): LengthAwarePaginator;

    public function stories(array $statutsVisibles): Collection;

   
    public function prestatairesReservesPar(int $membreId): array;

   
    public function clientsDuPrestataire(int $profilId): array;

    
    public function domainesInteretDe(int $membreId): array;


    public function listerAdmin(?string $etat, int $parPage = 15): LengthAwarePaginator;
}