<?php

namespace App\Http\Requests\Profil;

use Illuminate\Foundation\Http\FormRequest;

class DesactiverCompteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
       
        return $this->user()->password !== null
            ? ['mot_de_passe' => ['required', 'string', 'current_password:sanctum']]
            : ['confirmation' => ['required', 'in:DESACTIVER']];
    }

    public function messages(): array
    {
        return [
            'mot_de_passe.required'         => 'Veuillez saisir votre mot de passe pour confirmer.',
            'mot_de_passe.current_password' => 'Mot de passe incorrect.',
            'confirmation.required'         => 'Veuillez taper DESACTIVER pour confirmer.',
            'confirmation.in'               => 'Veuillez taper exactement DESACTIVER pour confirmer.',
        ];
    }
}