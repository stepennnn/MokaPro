<?php

namespace App\Http\Requests\Api;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveCategoryRequest extends FormRequest
{
    public function rules(): array
    {
        $category = $this->route('category');
        $uniqueName = Rule::unique('categories', 'name');

        if ($category instanceof Category) {
            $uniqueName->ignore($category->id);
        }

        $required = $this->isMethod('PATCH') ? 'sometimes|required' : 'required';

        return [
            'name' => [$required, 'string', 'max:255', $uniqueName],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
