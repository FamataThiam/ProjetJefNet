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
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(CodeListRepositoryInterface::class,            CodeListRepository::class);
        $this->app->bind(UserRepositoryInterface::class,                UserRepository::class);
        $this->app->bind(MembreRepositoryInterface::class,              MembreRepository::class);
        $this->app->bind(DomaineRepositoryInterface::class,             DomaineRepository::class);
        $this->app->bind(ProfilProfessionnelRepositoryInterface::class, ProfilProfessionnelRepository::class);
    }
}