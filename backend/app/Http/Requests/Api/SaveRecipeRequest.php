<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveRecipeRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'ingredients' => ['required', 'array', 'min:1'],
            'ingredients.*.ingredient_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('ingredients', 'id')->where('active', true),
            ],
            'ingredients.*.quantity' => [
                'required',
                'string',
                'regex:/\A\d{1,11}(?:\.\d{1,3})?\z/',
                'gt:0',
            ],
        ];
    }
}
