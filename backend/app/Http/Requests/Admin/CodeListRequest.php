<?php

namespace App\Http\Requests\Admin;

use App\Models\CodeList;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CodeListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; 
    }

    public function rules(): array
    {
        return [
            'type'        => ['required', 'string', Rule::in(CodeList::types())],
            'valeur'      => ['required', 'string', 'max:50', 'regex:/^[\pL0-9 _\-]+$/u'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.in'      => "Cette liste de valeurs n'existe pas.",
            'valeur.regex' => 'La valeur ne peut contenir que des lettres, des chiffres, des espaces, des tirets et des « _ ».',
        ];
    }
}