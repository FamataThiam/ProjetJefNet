<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SuspendreMembreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'motif' => ['required', 'string', 'min:10', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'motif.required' => 'Le motif de la suspension est obligatoire.',
            'motif.min'      => 'Le motif doit contenir au moins 10 caractères.',
            'motif.max'      => 'Le motif ne doit pas dépasser 500 caractères.',
        ];
    }
}