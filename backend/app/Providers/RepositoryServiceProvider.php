<?php

namespace App\Providers;

use App\Repositories\Contracts\CodeListRepositoryInterface;
use App\Repositories\Contracts\DomaineRepositoryInterface;
use App\Repositories\Contracts\MembreRepositoryInterface;
use App\Repositories\Contracts\ProfilProfessionnelRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Eloquent\CodeListRepository;
use App\Repositories\Eloquent\DomaineRepository;
use App\Repositories\Eloquent\MembreRepository;
use App\Repositories\Eloquent\ProfilProfessionnelRepository;
use App\Repositories\Eloquent\UserRepository;
use App\Repositories\Contracts\ServiceRepositoryInterface;
use App\Repositories\Eloquent\ServiceRepository;
use Illuminate\Support\ServiceProvider;
use App\Repositories\Contracts\DisponibiliteRepositoryInterface;
use App\Repositories\Eloquent\DisponibiliteRepository;
use App\Repositories\Contracts\DemandeServiceRepositoryInterface;
use App\Repositories\Eloquent\DemandeServiceRepository;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use App\Repositories\Contracts\ReservationRepositoryInterface;
use App\Repositories\Eloquent\NotificationRepository;
use App\Repositories\Eloquent\ReservationRepository;
use App\Repositories\Contracts\PaiementRepositoryInterface;
use App\Repositories\Eloquent\PaiementRepository;
use App\Repositories\Contracts\RapportRepositoryInterface;
use App\Repositories\Eloquent\RapportRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(CodeListRepositoryInterface::class, CodeListRepository::class);
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(MembreRepositoryInterface::class, MembreRepository::class);
        $this->app->bind(DomaineRepositoryInterface::class,DomaineRepository::class);
        $this->app->bind(ProfilProfessionnelRepositoryInterface::class, ProfilProfessionnelRepository::class);
        $this->app->bind(ServiceRepositoryInterface::class, ServiceRepository::class);
        $this->app->bind(DisponibiliteRepositoryInterface::class, DisponibiliteRepository::class);
        $this->app->bind(DemandeServiceRepositoryInterface::class, DemandeServiceRepository::class);
        $this->app->bind(ReservationRepositoryInterface::class, ReservationRepository::class);
        $this->app->bind(NotificationRepositoryInterface::class, NotificationRepository::class);
        $this->app->bind(PaiementRepositoryInterface::class, PaiementRepository::class);
        $this->app->bind(RapportRepositoryInterface::class, RapportRepository::class);
    }
}