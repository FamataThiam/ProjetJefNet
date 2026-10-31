<?php

namespace App\Http\Requests\Profil;

use Illuminate\Foundation\Http\FormRequest;

class CompleterProfilRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'prenom'    => mb_convert_case(trim((string) $this->prenom), MB_CASE_TITLE, 'UTF-8'),
            'nom'       => mb_convert_case(trim((string) $this->nom), MB_CASE_TITLE, 'UTF-8'),
            'username'  => strtolower(trim((string) $this->username)),
            'telephone' => preg_replace('/^(\+?221)/', '', preg_replace('/\s+/', '', (string) $this->telephone)),
            'ville'     => trim((string) $this->ville),
            'localite'  => trim((string) $this->localite),
        ]);
    }

    public function rules(): array
    {
        return [
            'prenom'    => ['required', 'string', 'max:100'],
            'nom'       => ['required', 'string', 'max:100'],
            'username'  => ['required', 'alpha_dash:ascii', 'min:3', 'max:30', 'unique:membres,username'],
            'telephone' => ['required', 'regex:/^7[05678]\d{7}$/', 'unique:membres,telephone'],
            'ville'     => ['required', 'string', 'max:100'],
            'localite'  => ['required', 'string', 'max:100'],
            'pays'      => ['nullable', 'string', 'max:100'],
            'photo'     => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'prenom.required'     => 'Le prénom est obligatoire.',
            'nom.required'        => 'Le nom est obligatoire.',
            'username.required'   => "Le nom d'utilisateur est obligatoire.",
            'username.alpha_dash' => "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores.",
            'username.min'        => "Le nom d'utilisateur doit contenir au moins 3 caractères.",
            'username.unique'     => "Ce nom d'utilisateur est déjà pris.",
            'telephone.required'  => 'Le numéro de téléphone est obligatoire.',
            'telephone.regex'     => 'Numéro invalide. Exemple : 77 123 45 67.',
            'telephone.unique'    => 'Ce numéro de téléphone est déjà utilisé.',
            'ville.required'      => 'La ville est obligatoire.',
            'localite.required'   => 'La localité est obligatoire.',
            'photo.image'         => 'Le fichier doit être une image.',
            'photo.mimes'         => 'Formats acceptés : JPG, PNG, WEBP.',
            'photo.max'           => "L'image ne doit pas dépasser 2 Mo.",
        ];
    }
}