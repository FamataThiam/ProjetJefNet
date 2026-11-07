<?php

namespace App\Http\Requests\ProfilPro;

use Illuminate\Foundation\Http\FormRequest;

class DemanderCertificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'justificatif' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],   // 5 Mo
        ];
    }
}