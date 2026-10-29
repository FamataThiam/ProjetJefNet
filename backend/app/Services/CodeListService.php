<?php

namespace App\Services;

use App\Repositories\Contracts\CodeListRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use InvalidArgumentException;

class CodeListService
{
    public function __construct(
        private CodeListRepositoryInterface $codeLists
    ) {}

    
    public function idOf(string $type, string $value): int
    {
        $id = Cache::remember(
            "codelist:$type:$value",
            now()->addDay(),
            fn () => $this->codeLists->findId($type, $value)
        );

        if (! $id) {
            throw new InvalidArgumentException("Valeur inconnue : $type / $value");
        }

        return $id;
    }

  
    public function valuesOf(string $type): Collection
    {
        return Cache::remember(
            "codelist:$type",
            now()->addDay(),
            fn () => $this->codeLists->activeByType($type)
        );
    }
}