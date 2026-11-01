<?php

namespace App\Http\Requests\Profil;

use Illuminate\Foundation\Http\FormRequest;

class PhotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'photo.required' => 'Veuillez choisir une photo.',
            'photo.image'    => 'Le fichier doit être une image.',
            'photo.mimes'    => 'Formats acceptés : JPG, PNG, WEBP.',
            'photo.max'      => "L'image ne doit pas dépasser 2 Mo.",
        ];
    }
}