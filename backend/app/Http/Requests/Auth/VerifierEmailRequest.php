<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifierEmailRequest extends FormRequest
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
            'email' => ['required', 'email'],
            'code'  => ['required', 'digits:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => "L'adresse e-mail est obligatoire.",
            'email.email'    => "L'adresse e-mail n'est pas valide.",
            'code.required'  => 'Le code est obligatoire.',
            'code.digits'    => 'Le code doit contenir exactement 6 chiffres.',
        ];
    }
}