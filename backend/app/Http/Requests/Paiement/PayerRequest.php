<?php

namespace App\Http\Requests\Paiement;

use Illuminate\Foundation\Http\FormRequest;

class PayerRequest extends FormRequest
{
    public const MODES      = ['MOBILE_MONEY', 'CARTE', 'ESPECES'];
    public const OPERATEURS = ['WAVE', 'ORANGE_MONEY', 'FREE_MONEY'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'mode'      => ['required', 'in:' . implode(',', self::MODES)],
            // required_if:mode,MOBILE_MONEY : le champ est requis si le mode de paiement est MOBILE_MONEY
            'operateur' => ['required_if:mode,MOBILE_MONEY', 'nullable', 'in:' . implode(',', self::OPERATEURS)],
            'telephone' => ['required_if:mode,MOBILE_MONEY', 'nullable', 'regex:/^7[05678]\d{7}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'mode.in'                => 'Moyen de paiement invalide (MOBILE_MONEY, CARTE ou ESPECES).',
            'operateur.required_if'  => "Choisissez l'opérateur (Wave, Orange Money ou Free Money).",
            'operateur.in'           => 'Opérateur invalide (WAVE, ORANGE_MONEY ou FREE_MONEY).',
            'telephone.required_if'  => 'Indiquez le numéro qui va payer.',
            'telephone.regex'        => 'Numéro invalide : 9 chiffres commençant par 70, 75, 76, 77 ou 78.',
        ];
    }
}