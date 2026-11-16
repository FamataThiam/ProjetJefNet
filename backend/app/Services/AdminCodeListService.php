<?php

namespace App\Services;

use App\Models\CodeList;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;


class AdminCodeListService
{
   
    public function lister(?string $type, ?string $etat): Collection
    {
        return CodeList::query()
            ->when($type, fn ($q) => $q->where('type', $type))
            ->when($etat === 'ACTIF', fn ($q) => $q->where('active', true))
            ->when($etat === 'INACTIF', fn ($q) => $q->where('active', false))
            ->orderBy('type')
            ->orderBy('value')
            ->get();
    }


    public function types(): array
    {
        $compteurs = CodeList::query()
            ->selectRaw('type, SUM(CASE WHEN active THEN 1 ELSE 0 END) AS actives, COUNT(*) AS total')
            ->groupBy('type')
            ->get()
            ->keyBy('type');

        return collect(CodeList::types())->map(fn (string $type) => [
            'type'     => $type,
            'actives'  => (int) ($compteurs[$type]->actives ?? 0),
            'inactives'=> (int) (($compteurs[$type]->total ?? 0) - ($compteurs[$type]->actives ?? 0)),
        ])->values()->all();
    }

  
    public function ajouter(string $type, string $valeur, ?string $description): CodeList
    {
        $valeur = $this->normaliser($valeur);

        $existante = CodeList::where('type', $type)->where('value', $valeur)->first();
        if ($existante) {
            throw ValidationException::withMessages([
                'valeur' => $existante->active
                    ? "La valeur {$valeur} existe déjà dans la liste {$type}."
                    : "La valeur {$valeur} existe déjà dans la liste {$type} mais elle est désactivée : réactivez-la plutôt que de la recréer.",
            ]);
        }

        return CodeList::create([
            'type'        => $type,
            'value'       => $valeur,
            'description' => $description,
            'active'      => true,
        ]);
    }

    public function activer(int $id): CodeList
    {
        $code = CodeList::findOrFail($id);

        if ($code->active) {
            throw ValidationException::withMessages(['valeur' => 'Cette valeur est déjà active.']);
        }

        $code->update(['active' => true]);

        return $code;
    }

    public function desactiver(int $id): CodeList
    {
        $code = CodeList::findOrFail($id);

        if ($code->estSysteme()) {
            throw ValidationException::withMessages([
                'valeur' => "La valeur {$code->value} est utilisée par le fonctionnement de JefNet : elle ne peut pas être désactivée.",
            ]);
        }
        if (! $code->active) {
            throw ValidationException::withMessages(['valeur' => 'Cette valeur est déjà désactivée.']);
        }

        $code->update(['active' => false]);

        return $code;
    }


    private function normaliser(string $valeur): string
    {
        return Str::of($valeur)->trim()->ascii()->upper()->replaceMatches('/[\s\-]+/', '_')->toString();
    }
}