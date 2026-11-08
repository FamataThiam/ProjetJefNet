<?php

namespace App\Http\Requests\Reservation;

use Illuminate\Foundation\Http\FormRequest;

class ReserverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'profil_id'            => ['required', 'integer'],
            'services'             => ['required', 'array', 'min:1', 'max:10'],
            'services.*'           => ['integer', 'distinct'],
            'date_prevue'          => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'heure_prevue'         => ['required', 'date_format:H:i'],
            'adresse_intervention' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'services.required'          => 'Choisissez au moins un service.',
            'services.*.distinct'        => 'Un même service ne peut pas être choisi deux fois.',
            'date_prevue.after_or_equal' => "La date doit être aujourd'hui ou une date future.",
        ];
    }
}