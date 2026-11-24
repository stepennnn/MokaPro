<?php

namespace App\Http\Requests\Api;

use App\Models\Ingredient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveIngredientRequest extends FormRequest
{
    public function rules(): array
    {
        $ingredient = $this->route('ingredient');
        $uniqueCode = Rule::unique('ingredients', 'code');

        if ($ingredient instanceof Ingredient) {
            $uniqueCode->ignore($ingredient->id);
        }

        $required = $this->isMethod('PATCH') ? ['sometimes', 'required'] : ['required'];

        return [
            'code' => [...$required, 'string', 'max:64', $uniqueCode],
            'name' => [...$required, 'string', 'max:255'],
            'unit' => [...$required, 'string', 'max:16'],
            'minimum_stock' => [...$required, 'string', 'regex:/\A\d{1,11}(?:\.\d{1,3})?\z/'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
