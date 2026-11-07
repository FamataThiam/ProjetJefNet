<?php

namespace App\Http\Requests\ProfilPro;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreerProfilProRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;   
    }

    public function rules(): array
    {
        return [
            'titre_professionnel' => ['required', 'string', 'max:100'],
            'experience'          => ['nullable', 'string', 'max:100'],
            'biographie'          => ['nullable', 'string', 'max:2000'],
            'linkedin'            => ['nullable', 'url:https', 'max:255'],
            'portfolio'           => ['nullable', 'url:http,https', 'max:255'],
            'rayon_intervention'  => [
                'required',
                Rule::exists('code_lists', 'value')
                    ->where('type', 'RayonIntervention')
                    ->where('active', true),
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'titre_professionnel' => 'titre professionnel',
            'experience'          => 'expérience',
            'rayon_intervention'  => "rayon d'intervention",
        ];
    }
}