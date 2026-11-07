<?php

namespace App\Http\Requests\ProfilPro;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AjouterServiceRequest extends FormRequest
{
    public const UNITES = ['forfait', 'heure', 'jour', 'm2', 'piece'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'domaine_id'  => ['required', 'integer', 'exists:domaines,id'],
            'nom'         => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'prix'        => ['required', 'numeric', 'min:0', 'max:99999999'],
            'unite_tarif' => ['required', Rule::in(self::UNITES)],
            'duree'       => ['required', 'integer', 'min:15', 'max:43200'],   // en minutes (15 min à 30 jours)
        ];
    }

    public function attributes(): array
    {
        return [
            'domaine_id'  => 'domaine',
            'unite_tarif' => 'unité de tarif',
            'duree'       => 'durée',
        ];
    }
}