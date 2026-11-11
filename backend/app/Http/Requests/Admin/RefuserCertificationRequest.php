<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class RefuserCertificationRequest extends FormRequest
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
            'motif.required' => 'Indiquez le motif du refus : il sera envoyé au prestataire.',
            'motif.min'      => 'Le motif doit contenir au moins 10 caractères.',
        ];
    }
}