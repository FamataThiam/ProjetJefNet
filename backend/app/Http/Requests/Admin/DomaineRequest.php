<?php

namespace App\Http\Requests\Admin;

use App\Models\Domaine;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

class DomaineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

        
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('libelle'))) {
            $this->merge([
                'libelle' => preg_replace('/\s+/u', ' ', trim($this->input('libelle'))),
            ]);
        }
    }

    public function rules(): array
    {
        $id = $this->route('id');            
        $creation   = $id === null;

        return [
            'libelle' => [
                $creation ? 'required' : 'sometimes',
                'string', 'min:3', 'max:100',
                
                function (string $attribut, mixed $valeur, Closure $echec) use ($id) {
                    $existe = Domaine::whereRaw('LOWER(libelle) = LOWER(?)', [trim((string) $valeur)])
                        ->when($id, fn ($q) => $q->where('id', '!=', $id))
                        ->exists();

                    if ($existe) {
                        $echec('Un domaine porte déjà ce nom.');
                    }
                },
            ],
            'description'     => ['nullable', 'string', 'max:1000'],
            'image'           => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'supprimer_image' => ['sometimes', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'libelle' => 'nom du domaine',
        ];
    }

    public function messages(): array
    {
        return [
            'image.image' => "Le fichier doit être une image.",
            'image.mimes' => "L'image doit être au format JPG, PNG ou WEBP.",
            'image.max'   => "L'image ne doit pas dépasser 2 Mo.",
        ];
    }
}