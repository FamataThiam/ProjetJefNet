<?php

namespace App\Http\Requests\ProfilPro;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ModifierServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'domaine_id'  => ['sometimes', 'required', 'integer', 'exists:domaines,id'],
            'nom'         => ['sometimes', 'required', 'string', 'max:150'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'prix'        => ['sometimes', 'required', 'numeric', 'min:0', 'max:99999999'],
            'unite_tarif' => ['sometimes', 'required', Rule::in(AjouterServiceRequest::UNITES)],
            'duree'       => ['sometimes', 'required', 'integer', 'min:15', 'max:43200'],
            'est_actif'   => ['sometimes', 'required', 'boolean'],   // true = réactiver le service
        ];
    }

    public function attributes(): array
    {
        return [
            'domaine_id'  => 'domaine',
            'unite_tarif' => 'unité de tarif',
            'duree'       => 'durée',
            'est_actif'   => 'statut du service',
        ];
    }
}