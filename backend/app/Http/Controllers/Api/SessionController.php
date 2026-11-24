<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\LoginRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SessionController extends Controller
{
    private const FAILURE_LIMIT = 5;

    private const FAILURE_DECAY_SECONDS = 900;

    public function loginOptions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(Role::CODES)],
        ]);

        $employees = User::query()
            ->where('active', true)
            ->whereHas('roles', fn ($query) => $query->where('code', $validated['role']))
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json(['data' => $employees]);
    }

    public function store(LoginRequest $request): JsonResponse
    {
        $employeeId = (int) $request->validated('employee_id');
        $roleCode = $request->validated('role');
        $pin = $request->validated('pin');
        $failureKey = $this->failureKey($employeeId);
        $lockoutKey = $this->lockoutKey($employeeId);

        if (RateLimiter::tooManyAttempts($lockoutKey, 1)) {
            $this->rejectCredentials();
        }

        $employee = User::query()
            ->whereKey($employeeId)
            ->where('active', true)
            ->first();

        $credentialsMatch = $employee
            && $employee->hasRole($roleCode)
            && $employee->pin_hash !== null
            && Hash::check($pin, $employee->pin_hash);

        if (! $credentialsMatch) {
            if (RateLimiter::hit($failureKey, self::FAILURE_DECAY_SECONDS) >= self::FAILURE_LIMIT) {
                RateLimiter::hit($lockoutKey, self::FAILURE_DECAY_SECONDS);
            }

            $this->rejectCredentials();
        }

        RateLimiter::clear($failureKey);
        RateLimiter::clear($lockoutKey);

        Auth::login($employee);
        $request->session()->regenerate();
        $request->session()->put('active_role', $roleCode);

        return response()->json([
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
            ],
            'active_role' => $roleCode,
        ]);
    }

    public function show(Request $request): JsonResponse
    {
        /** @var User $employee */
        $employee = $request->user();

        return response()->json([
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
            ],
            'active_role' => $request->session()->get('active_role'),
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([], 204);
    }

    private function failureKey(int $employeeId): string
    {
        return 'pin-login:failures:'.hash('sha256', (string) $employeeId);
    }

    private function lockoutKey(int $employeeId): string
    {
        return 'pin-login:lockout:'.hash('sha256', (string) $employeeId);
    }

    private function rejectCredentials(): never
    {
        throw ValidationException::withMessages([
            'credentials' => ['Invalid employee or PIN.'],
        ]);
    }
}
