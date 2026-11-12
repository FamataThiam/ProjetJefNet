<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListerMembresRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;   
    }

    public function rules(): array
    {
        return [
            'recherche' => ['nullable', 'string', 'max:100'],
            'role'      => ['nullable', Rule::in(['CLIENT', 'PRESTATAIRE'])],
            'statut'    => ['nullable', Rule::in(['ACTIF', 'INACTIF', 'BLOQUE', 'SIGNALE'])],
        ];
    }

    public function messages(): array
    {
        return [
            'role.in'   => 'Le rôle doit être CLIENT ou PRESTATAIRE.',
            'statut.in' => 'Le statut doit être ACTIF, INACTIF, BLOQUE ou SIGNALE.',
        ];
    }
}