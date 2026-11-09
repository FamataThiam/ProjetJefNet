<?php

namespace App\Http\Requests\Rapport;

use Illuminate\Foundation\Http\FormRequest;

class SignerRapportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Signature dessinée (facultative si le client en a déjà une dans son profil)
            'signature' => ['nullable', 'string', 'starts_with:data:image/png;base64,', 'max:700000'],
        ];
    }

    public function messages(): array
    {
        return [
            'signature.starts_with' => 'La signature doit être une image PNG dessinée dans la zone de signature.',
            'signature.max'         => 'La signature est trop lourde.',
        ];
    }
}