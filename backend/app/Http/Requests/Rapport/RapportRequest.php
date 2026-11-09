<?php

namespace App\Http\Requests\Rapport;

use Illuminate\Foundation\Http\FormRequest;

class RapportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
       
        $obligatoire = $this->routeIs('rapport.rediger') ? 'required' : 'sometimes';

        return [
            'description_prestation' => [$obligatoire, 'string', 'min:20', 'max:3000'],
            'observations'           => ['nullable', 'string', 'max:2000'],
            'photo_avant'            => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'photo_apres'            => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'signature'              => ['nullable', 'string', 'starts_with:data:image/png;base64,', 'max:700000'],
        ];
    }

    public function messages(): array
    {
        return [
            'description_prestation.required' => 'Décrivez le travail réalisé.',
            'description_prestation.min'      => 'La description doit contenir au moins 20 caractères.',
            'photo_avant.image'               => 'La photo « avant » doit être une image (jpg, png ou webp).',
            'photo_apres.image'               => 'La photo « après » doit être une image (jpg, png ou webp).',
            'photo_avant.max'                 => 'La photo « avant » ne doit pas dépasser 5 Mo.',
            'photo_apres.max'                 => 'La photo « après » ne doit pas dépasser 5 Mo.',
            'signature.starts_with'           => 'La signature doit être une image PNG dessinée dans la zone de signature.',
            'signature.max'                   => 'La signature est trop lourde.',
        ];
    }
}