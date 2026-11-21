<?php

namespace App\Http\Requests\Notification;

use Illuminate\Foundation\Http\FormRequest;


class LireNotificationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ids'   => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer'],
        ];
    }
}