<?php

namespace App\Http\Requests\Api;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $employee = $this->route('user');
        $uniqueEmail = Rule::unique('users', 'email');

        if ($employee instanceof User) {
            $uniqueEmail->ignore($employee->id);
        }

        $isPatch = $this->isMethod('PATCH');
        $required = $isPatch ? ['sometimes', 'required'] : ['required'];

        $rules = [
            'name' => [...$required, 'string', 'max:255'],
            'email' => ['sometimes', 'nullable', 'string', 'email', 'max:255', $uniqueEmail],
            'role' => [...$required, 'string', Rule::in(Role::CODES)],
            'active' => ['sometimes', 'boolean'],
        ];

        if (! $isPatch) {
            $rules['pin'] = ['required', 'string', 'regex:/\A[0-9]{6}\z/'];
        }

        return $rules;
    }
}
