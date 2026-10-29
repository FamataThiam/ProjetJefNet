<?php

namespace App\Providers;

use App\Repositories\Contracts\CodeListRepositoryInterface;
use App\Repositories\Eloquent\CodeListRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Interface a l'implémentation
        $this->app->bind(CodeListRepositoryInterface::class, CodeListRepository::class);
    }
}