<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CreateEmployee extends Command
{
    protected $signature = 'mokapro:employee';

    protected $description = 'Create an employee account with PIN authentication';

    public function handle(): int
    {
        $attributes = [
            'name' => $this->ask('Employee name'),
            'email' => $this->ask('Employee email'),
            'pin' => $this->secret('Employee PIN'),
            'roles' => $this->choice('Employee roles', Role::CODES, null, null, true),
        ];

        $validator = Validator::make($attributes, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'pin' => ['required', 'string', 'regex:/\A[0-9]{6,12}\z/'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['required', 'string', Rule::in(Role::CODES)],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $validated = $validator->validated();
        $employee = new User;
        $employee->forceFill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make(Str::random(64)),
            'pin_hash' => Hash::make($validated['pin']),
            'active' => true,
        ])->save();
        $employee->roles()->sync(
            Role::query()->whereIn('code', $validated['roles'])->pluck('id'),
        );

        $this->info("Created employee {$employee->name} (ID {$employee->id}).");

        return self::SUCCESS;
    }
}
