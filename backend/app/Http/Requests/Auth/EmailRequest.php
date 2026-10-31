<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class EmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['email' => strtolower(trim((string) $this->email))]);
    }

    public function rules(): array
    {
        return ['email' => ['required', 'email']];
    }

    public function messages(): array
    {
        return [
            'email.required' => "L'adresse e-mail est obligatoire.",
            'email.email'    => "L'adresse e-mail n'est pas valide.",
        ];
    }



      public function motDePasseOublie(EmailRequest $request): JsonResponse
    {
        $this->auth->demanderReinitialisation($request->email);

        return response()->json([
            'message' => 'Si un compte existe pour cette adresse, un code de réinitialisation vient d\'être envoyé.',
        ]);
    }
}