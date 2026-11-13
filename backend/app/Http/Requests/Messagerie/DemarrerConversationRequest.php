<?php

namespace App\Http\Requests\Messagerie;

use Illuminate\Foundation\Http\FormRequest;

class DemarrerConversationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'destinataire_id' => ['required', 'integer', 'exists:membres,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'destinataire_id.required' => 'Choisissez la personne à qui écrire.',
            'destinataire_id.exists'   => "Ce membre n'existe pas.",
        ];
    }
}