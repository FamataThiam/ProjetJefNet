<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ReinitialiserMotDePasseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower(trim((string) $this->email)),
            'code'  => trim((string) $this->code),
        ]);
    }

    public function rules(): array
    {
        return [
            'email'    => ['required', 'email'],
            'code'     => ['required', 'digits:6'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required'     => "L'adresse e-mail est obligatoire.",
            'email.email'        => "L'adresse e-mail n'est pas valide.",
            'code.required'      => 'Le code est obligatoire.',
            'code.digits'        => 'Le code doit contenir exactement 6 chiffres.',
            'password.required'  => 'Le nouveau mot de passe est obligatoire.',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
            'password.min'       => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.letters'   => 'Le mot de passe doit contenir au moins une lettre.',
            'password.numbers'   => 'Le mot de passe doit contenir au moins un chiffre.',
        ];
    }
}