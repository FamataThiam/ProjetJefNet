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
            'destinataire_uuid' => ['required_without:destinataire_id', 'uuid', 'exists:users,uuid'],
            'destinataire_id'   => ['required_without:destinataire_uuid', 'integer', 'exists:membres,id'],
        ];
    }
}