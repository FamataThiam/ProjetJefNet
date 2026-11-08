<?php

namespace App\Http\Requests\Demande;

use Illuminate\Foundation\Http\FormRequest;

class AccepterDemandeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_id'   => ['required', 'integer'],
            'date_prevue'  => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'heure_prevue' => ['required', 'date_format:H:i'],
            'prix_final'   => ['nullable', 'numeric', 'min:0', 'max:99999999'],
        ];
    }

    public function messages(): array
    {
        return [
            'date_prevue.after_or_equal' => "La date doit être aujourd'hui ou une date future.",
        ];
    }
}