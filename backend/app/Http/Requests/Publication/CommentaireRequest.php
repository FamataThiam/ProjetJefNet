<?php

namespace App\Http\Requests\Publication;

use Illuminate\Foundation\Http\FormRequest;

class CommentaireRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contenu'   => ['required', 'string', 'min:1', 'max:1000'],
            'parent_id' => ['nullable', 'integer'],  
        ];
    }

    public function messages(): array
    {
        return [
            'contenu.required' => 'Le commentaire est vide.',
            'contenu.max'      => 'Un commentaire ne doit pas dépasser 1000 caractères.',
        ];
    }
}