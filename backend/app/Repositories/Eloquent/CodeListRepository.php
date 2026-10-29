<?php

namespace App\Repositories\Eloquent;

use App\Models\CodeList;
use App\Repositories\Contracts\CodeListRepositoryInterface;
use Illuminate\Support\Collection;

class CodeListRepository implements CodeListRepositoryInterface
{
    public function findId(string $type, string $value): ?int
    {
        return CodeList::where('type', $type)
            ->where('value', $value)
            ->value('id');
    }

    public function activeByType(string $type): Collection
    {
        return CodeList::where('type', $type)
            ->where('active', true)
            ->orderBy('value')
            ->get();
    }
}