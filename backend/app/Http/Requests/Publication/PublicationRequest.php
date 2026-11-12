<?php

namespace App\Http\Requests\Publication;

use Illuminate\Foundation\Http\FormRequest;

class PublicationRequest extends FormRequest
{
    public const MAX_MEDIAS = 4;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $creation = $this->route('id') === null;

        return [
            'titre'       => [$creation ? 'required' : 'sometimes', 'string', 'min:3', 'max:150'],
            'description' => ['nullable', 'string', 'max:3000'],

           
            'medias'      => ['nullable', 'array', 'max:' . self::MAX_MEDIAS],
            'medias.*'    => ['file', 'mimetypes:image/jpeg,image/png,image/webp,video/mp4', 'max:20480'],

            
            'medias_a_supprimer'   => ['sometimes', 'array'],
            'medias_a_supprimer.*' => ['integer'],
        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                foreach ($this->file('medias', []) as $i => $fichier) {
                    if (str_starts_with((string) $fichier->getMimeType(), 'image/') && $fichier->getSize() > 5 * 1024 * 1024) {
                        $validator->errors()->add("medias.$i", 'Une image ne doit pas dépasser 5 Mo.');
                    }
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            'medias.max'         => 'Vous pouvez ajouter au maximum ' . self::MAX_MEDIAS . ' photos ou vidéos.',
            'medias.*.mimetypes' => 'Formats acceptés : JPG, PNG, WEBP ou vidéo MP4.',
            'medias.*.max'       => 'Une vidéo ne doit pas dépasser 20 Mo.',
        ];
    }
}