<?php

namespace App\Http\Requests\Profil;

use Illuminate\Foundation\Http\FormRequest;

class SignatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'signature' => ['required', 'image', 'mimes:png', 'max:1024'],
        ];
    }

    public function messages(): array
    {
        return [
            'signature.required' => 'Veuillez fournir votre signature.',
            'signature.image'    => 'La signature doit être une image.',
            'signature.mimes'    => 'La signature doit être au format PNG.',
            'signature.max'      => 'La signature ne doit pas dépasser 1 Mo.',
        ];
    }
}