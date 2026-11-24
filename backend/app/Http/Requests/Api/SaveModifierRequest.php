<?php

namespace App\Http\Requests\Api;

use App\Models\Modifier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveModifierRequest extends FormRequest
{
    public function rules(): array
    {
        $modifier = $this->route('modifier');
        $uniqueCode = Rule::unique('modifiers', 'code');

        if ($modifier instanceof Modifier) {
            $uniqueCode->ignore($modifier->id);
        }

        $required = $this->isMethod('PATCH') ? ['sometimes', 'required'] : ['required'];

        return [
            'code' => [...$required, 'string', 'max:64', $uniqueCode],
            'name' => [...$required, 'string', 'max:255'],
            'type' => [...$required, Rule::in(['choice', 'text', 'boolean'])],
            'value' => [...$required, 'string', 'max:255'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
