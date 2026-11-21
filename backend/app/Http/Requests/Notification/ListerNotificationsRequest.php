<?php

namespace App\Http\Requests\Notification;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;


class ListerNotificationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'etat'     => ['nullable', Rule::in(['toutes', 'non_lues', 'lues'])],
            'non_lues' => ['nullable', 'boolean'],   // ancien paramètre, toujours accepté
            'type'     => [
                'nullable',
                Rule::exists('code_lists', 'value')->where('type', 'TypeNotification'),
            ],
            'q'        => ['nullable', 'string', 'max:100'],
        ];
    }

 
    public function filtres(): array
    {
        $etat = $this->validated('etat') ?? ($this->boolean('non_lues') ? 'non_lues' : 'toutes');

        return [
            'etat' => $etat,
            'type' => $this->validated('type'),
            'q'    => trim((string) $this->validated('q')) ?: null,
        ];
    }
}