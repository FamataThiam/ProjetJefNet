<?php

namespace App\Http\Requests\Profil;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ModifierProfilRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $nettoye = [];

        // On ne nettoie QUE les champs envoyés, pour ne pas les rendre « présents » par erreur
        foreach (['prenom', 'nom'] as $champ) {
            if ($this->has($champ)) {
                $nettoye[$champ] = mb_convert_case(trim((string) $this->input($champ)), MB_CASE_TITLE, 'UTF-8');
            }
        }

        foreach (['ville', 'localite', 'couleur_perso'] as $champ) {
            if ($this->has($champ)) {
                $nettoye[$champ] = trim((string) $this->input($champ));
            }
        }

        if ($this->has('username')) {
            $nettoye['username'] = strtolower(trim((string) $this->username));
        }

        if ($this->has('telephone')) {
            // « 77 123 45 67 » ou « +221771234567 » → « 771234567 »
            $nettoye['telephone'] = preg_replace('/^(\+?221)/', '', preg_replace('/\s+/', '', (string) $this->telephone));
        }

        $this->merge($nettoye);
    }

    public function rules(): array
    {
        $membreId = $this->user()->membre?->id;

        return [
            'prenom'        => ['sometimes', 'required', 'string', 'max:100'],
            'nom'           => ['sometimes', 'required', 'string', 'max:100'],
            'username'      => ['sometimes', 'required', 'regex:/^[a-z0-9._-]+$/', 'min:3', 'max:30',
                                Rule::unique('membres', 'username')->ignore($membreId)],
            'telephone'     => ['sometimes', 'required', 'regex:/^7[05678]\d{7}$/',
                                Rule::unique('membres', 'telephone')->ignore($membreId)],
            'ville'         => ['sometimes', 'required', 'string', 'max:100'],
            'localite'      => ['sometimes', 'required', 'string', 'max:100'],
            'couleur_perso' => ['sometimes', 'required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            // Pas de « pays » : JefNet est limité au Sénégal, le pays n'est pas modifiable
        ];
    }

    public function messages(): array
    {
        return [
            '*.required'          => 'Ce champ ne peut pas être vide.',
            'username.regex'      => "Le nom d'utilisateur ne peut contenir que des minuscules, chiffres, points, tirets et underscores.",
            'username.min'        => "Le nom d'utilisateur doit contenir au moins 3 caractères.",
            'username.max'        => "Le nom d'utilisateur ne doit pas dépasser 30 caractères.",
            'username.unique'     => "Ce nom d'utilisateur est déjà pris.",
            'telephone.regex'     => 'Numéro invalide. Exemple : 77 123 45 67.',
            'telephone.unique'    => 'Ce numéro de téléphone est déjà utilisé.',
            'couleur_perso.regex' => 'La couleur doit être au format #RRGGBB, par exemple #0174AB.',
        ];
    }
}