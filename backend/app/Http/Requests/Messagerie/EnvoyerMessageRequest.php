<?php

namespace App\Http\Requests\Messagerie;

use Illuminate\Foundation\Http\FormRequest;

class EnvoyerMessageRequest extends FormRequest
{
    
    public const FORMATS = [
       
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
       
        'video/mp4', 'video/webm',
       
        'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav',
       
        'application/pdf', 'text/plain',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contenu'      => ['nullable', 'string', 'max:5000'],
            'fichier'      => ['nullable', 'file', 'mimetypes:' . implode(',', self::FORMATS), 'max:20480'],
            'vocal'        => ['sometimes', 'boolean'],          // 1 = enregistrement du micro
            'reponse_a_id' => ['nullable', 'integer'],
        ];
    }


    public function after(): array
    {
        return [
            function ($validator) {
                $fichier = $this->file('fichier');
                if (! $fichier) {
                    return;
                }

                $mime   = (string) $fichier->getMimeType();
                $taille = $fichier->getSize();
                $mo     = 1024 * 1024;

                $limite = match (true) {
                    str_starts_with($mime, 'image/') => 5,
                    str_starts_with($mime, 'video/') && ! $this->boolean('vocal') => 20,
                    default => 10,                                // audio, vocal, documents
                };

                if ($taille > $limite * $mo) {
                    $validator->errors()->add('fichier', "Ce fichier dépasse la limite de {$limite} Mo.");
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            'contenu.max'        => 'Un message ne doit pas dépasser 5000 caractères.',
            'fichier.mimetypes'  => 'Format non accepté. Formats possibles : photo, vidéo MP4, vocal, PDF, Word, Excel ou texte.',
            'fichier.max'        => 'Un fichier ne doit pas dépasser 20 Mo.',
        ];
    }
}