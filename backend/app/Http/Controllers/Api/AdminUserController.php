<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ResetEmployeePinRequest;
use App\Http\Requests\Api\SaveEmployeeRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminUserController extends Controller
{
    public function index(): JsonResponse
    {
        $employees = User::query()
            ->with('roles:id,code,name')
            ->orderBy('name')
            ->get()
            ->map(fn (User $employee): array => $this->employeeData($employee))
            ->values();

        return response()->json(['data' => $employees]);
    }

    public function store(SaveEmployeeRequest $request): JsonResponse
    {
        $data = $request->validated();

        $employee = DB::transaction(function () use ($data): User {
            $email = isset($data['email']) && trim((string) $data['email']) !== ''
                ? trim((string) $data['email'])
                : $this->generateUniqueEmail($data['name']);

            $employee = new User;
            $employee->forceFill([
                'name' => trim($data['name']),
                'email' => $email,
                'password' => Hash::make(Str::random(64)),
                'pin_hash' => Hash::make($data['pin']),
                'active' => $data['active'] ?? true,
            ])->save();

            $role = Role::query()->where('code', $data['role'])->firstOrFail();
            $employee->roles()->sync([$role->id]);

            return $employee->load('roles:id,code,name');
        });

        return response()->json(['data' => $this->employeeData($employee)], 201);
    }

    public function update(SaveEmployeeRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();
        $actingAdmin = $request->user();

        if ($actingAdmin instanceof User && $actingAdmin->id === $user->id) {
            if (array_key_exists('active', $data) && $data['active'] === false) {
                throw ValidationException::withMessages([
                    'active' => ['Anda tidak dapat menonaktifkan akun admin Anda sendiri.'],
                ]);
            }

            if (array_key_exists('role', $data) && $data['role'] !== 'admin') {
                throw ValidationException::withMessages([
                    'role' => ['Anda tidak dapat menurunkan role admin akun Anda sendiri.'],
                ]);
            }
        }

        $updated = DB::transaction(function () use ($user, $data): User {
            $updates = [];

            if (array_key_exists('name', $data)) {
                $updates['name'] = trim($data['name']);
            }

            if (array_key_exists('email', $data) && $data['email'] !== null && trim((string) $data['email']) !== '') {
                $updates['email'] = trim((string) $data['email']);
            }

            if (array_key_exists('active', $data)) {
                $updates['active'] = (bool) $data['active'];
            }

            if ($updates !== []) {
                $user->forceFill($updates)->save();
            }

            if (array_key_exists('role', $data)) {
                $role = Role::query()->where('code', $data['role'])->firstOrFail();
                $user->roles()->sync([$role->id]);
            }

            return $user->fresh('roles:id,code,name');
        });

        return response()->json(['data' => $this->employeeData($updated)]);
    }

    public function resetPin(ResetEmployeePinRequest $request, User $user): JsonResponse
    {
        $user->forceFill([
            'pin_hash' => Hash::make($request->validated('pin')),
        ])->save();

        SessionController::clearLoginLockout($user->id);

        return response()->json([
            'message' => 'PIN karyawan berhasil direset.',
            'data' => $this->employeeData($user->fresh('roles:id,code,name')),
        ]);
    }

    private function generateUniqueEmail(string $name): string
    {
        $slug = Str::slug($name);
        $prefix = $slug !== '' ? $slug : 'employee';

        do {
            $email = $prefix.'-'.strtolower(Str::random(6)).'@mokapro.local';
        } while (User::query()->where('email', $email)->exists());

        return $email;
    }

    /**
     * @return array{id: int, name: string, email: string, role: string|null, roles: array<int, string>, active: bool, created_at: string|null}
     */
    private function employeeData(User $employee): array
    {
        $roleCodes = $employee->roles->pluck('code')->values()->all();

        return [
            'id' => $employee->id,
            'name' => $employee->name,
            'email' => $employee->email,
            'role' => $roleCodes[0] ?? null,
            'roles' => $roleCodes,
            'active' => (bool) $employee->active,
            'created_at' => $employee->created_at?->toIso8601String(),
        ];
    }
}
