<?php

namespace App\Http\Requests\Api;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveProductRequest extends FormRequest
{
    public function rules(): array
    {
        $product = $this->route('product');
        $uniqueCode = Rule::unique('products', 'code');

        if ($product instanceof Product) {
            $uniqueCode->ignore($product->id);
        }

        $required = $this->isMethod('PATCH') ? ['sometimes', 'required'] : ['required'];

        return [
            'code' => [...$required, 'string', 'max:64', $uniqueCode],
            'name' => [...$required, 'string', 'max:255'],
            'category_id' => [
                ...$required,
                'integer',
                Rule::exists('categories', 'id')->where('active', true),
            ],
            'price' => [...$required, 'string', 'regex:/\A\d+(?:\.\d{1,2})?\z/'],
            'active' => ['sometimes', 'boolean'],
            'image' => ['sometimes', 'nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }
}
