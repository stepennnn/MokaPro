<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRestockRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'reference' => ['required', 'string', 'max:191'],
            'note' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.ingredient_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('ingredients', 'id')->where('active', true),
            ],
            'items.*.quantity' => [
                'required',
                'string',
                'regex:/\A\d{1,11}(?:\.\d{1,3})?\z/',
                'gt:0',
            ],
        ];
    }
}
