<?php

namespace App\Http\Requests\Reservation;

use Illuminate\Foundation\Http\FormRequest;

class MotifRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Le motif est obligatoire pour annuler, facultatif pour refuser
        $obligatoire = $this->routeIs('reservations.annuler') ? 'required' : 'nullable';

        return [
            'raison' => [$obligatoire, 'string', 'min:5', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'raison.required' => "Indiquez la raison de l'annulation.",
            'raison.min'      => 'La raison doit contenir au moins 5 caractères.',
        ];
    }
}