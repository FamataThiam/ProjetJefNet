<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class InscriptionRequest extends FormRequest
{
    
    public function authorize(): bool
    {
        return true;
    }

    
    protected function prepareForValidation(): void
    {
        $this->merge([
            'email'  => strtolower(trim((string) $this->email)),
            'nom'    => trim((string) $this->nom),
            'prenom' => trim((string) $this->prenom),
        ]);
    }

    public function rules(): array
    {
        return [
            'prenom'   => ['required', 'string', 'max:100'],
            'nom'      => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ];
    }

   
    public function messages(): array
    {
        return [
            'prenom.required'    => 'Le prénom est obligatoire.',
            'nom.required'       => 'Le nom est obligatoire.',
            'email.required'     => 'L\'adresse e-mail est obligatoire.',
            'email.email'        => 'L\'adresse e-mail n\'est pas valide.',
            'email.unique'       => 'Cette adresse e-mail est déjà utilisée.',
            'password.required'  => 'Le mot de passe est obligatoire.',
            'password.confirmed' => 'Les deux mots de passe ne correspondent pas.',
            'password.min'       => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.letters'   => 'Le mot de passe doit contenir au moins une lettre.',
            'password.numbers'   => 'Le mot de passe doit contenir au moins un chiffre.',
        ];
    }
}