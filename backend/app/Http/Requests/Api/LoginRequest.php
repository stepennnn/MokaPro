<?php

namespace App\Http\Requests\Api;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LoginRequest extends FormRequest
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
        return [
            'employee_id' => ['required', 'integer', 'min:1'],
            'role' => ['required', 'string', Rule::in(Role::CODES)],
            'pin' => ['required', 'string', 'regex:/\A[0-9]{6,12}\z/'],
        ];
    }
}
