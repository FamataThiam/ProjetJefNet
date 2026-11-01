<?php

namespace App\Http\Requests\Profil;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ChangerMotDePasseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
    
        $aUnMotDePasse = $this->user()->password !== null;

        return [
            'mot_de_passe_actuel' => $aUnMotDePasse
                ? ['required', 'string', 'current_password:sanctum']
                : ['prohibited'],
            'password' => [
                'required', 'confirmed', 'different:mot_de_passe_actuel',
                Password::min(8)->letters()->numbers(),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'mot_de_passe_actuel.required'         => 'Votre mot de passe actuel est obligatoire.',
            'mot_de_passe_actuel.current_password' => 'Le mot de passe actuel est incorrect.',
            'mot_de_passe_actuel.prohibited'       => "Votre compte n'a pas encore de mot de passe : laissez ce champ vide.",
            'password.required'                    => 'Le nouveau mot de passe est obligatoire.',
            'password.confirmed'                   => 'La confirmation du mot de passe ne correspond pas.',
            'password.different'                   => "Le nouveau mot de passe doit être différent de l'actuel.",
            'password.min'                         => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.letters'                     => 'Le mot de passe doit contenir au moins une lettre.',
            'password.numbers'                     => 'Le mot de passe doit contenir au moins un chiffre.',
        ];
    }
}