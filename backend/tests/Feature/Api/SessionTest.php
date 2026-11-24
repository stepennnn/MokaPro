<?php

namespace Tests\Feature\Api;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_log_in_with_six_digit_pin(): void
    {
        $employee = $this->employeeWithPin('123456');

        $this->postJson('/api/login', [
            'employee_id' => $employee->id,
            'role' => 'cashier',
            'pin' => '123456',
        ], ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonPath('employee.id', $employee->id)
            ->assertJsonPath('employee.name', $employee->name)
            ->assertJsonPath('active_role', 'cashier')
            ->assertJsonMissingPath('employee.email')
            ->assertJsonMissingPath('employee.pin_hash');

        $this->assertAuthenticatedAs($employee);
        $this->assertSame('cashier', session('active_role'));
    }

    public function test_employee_can_log_in_with_twelve_digit_pin(): void
    {
        $employee = $this->employeeWithPin('123456789012');

        $this->postJson('/api/login', [
            'employee_id' => $employee->id,
            'role' => 'cashier',
            'pin' => '123456789012',
        ], ['Origin' => 'http://localhost'])->assertOk();
    }

    public function test_wrong_pin_does_not_authenticate_employee(): void
    {
        $employee = $this->employeeWithPin('123456');

        $this->postJson('/api/login', [
            'employee_id' => $employee->id,
            'role' => 'cashier',
            'pin' => '654321',
        ], ['Origin' => 'http://localhost'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Invalid employee or PIN.');

        $this->assertGuest();
        $this->assertFalse(session()->has('active_role'));
    }

    public function test_missing_employee_is_rejected_without_authentication(): void
    {
        $this->postJson('/api/login', [
            'employee_id' => 99999,
            'role' => 'cashier',
            'pin' => '123456',
        ], ['Origin' => 'http://localhost'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Invalid employee or PIN.');

        $this->assertGuest();
    }

    public function test_employee_cannot_log_in_with_unassigned_role(): void
    {
        $employee = $this->employeeWithPin('123456', 'cashier');

        $this->postJson('/api/login', [
            'employee_id' => $employee->id,
            'role' => 'barista',
            'pin' => '123456',
        ], ['Origin' => 'http://localhost'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Invalid employee or PIN.');

        $this->assertGuest();
    }

    public function test_five_digit_pin_is_rejected_as_malformed(): void
    {
        $employee = $this->employeeWithPin('123456');

        $this->postJson('/api/login', [
            'employee_id' => $employee->id,
            'role' => 'cashier',
            'pin' => '12345',
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        $this->assertGuest();
    }

    public function test_non_numeric_pin_is_rejected_as_malformed(): void
    {
        $employee = $this->employeeWithPin('123456');

        $this->postJson('/api/login', [
            'employee_id' => $employee->id,
            'role' => 'cashier',
            'pin' => '12a456',
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        $this->assertGuest();
    }

    public function test_thirteen_digit_pin_is_rejected_as_malformed(): void
    {
        $employee = $this->employeeWithPin('123456');

        $this->postJson('/api/login', [
            'employee_id' => $employee->id,
            'role' => 'cashier',
            'pin' => '1234567890123',
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        $this->assertGuest();
    }

    public function test_inactive_employee_cannot_log_in(): void
    {
        $employee = $this->employeeWithPin('123456');
        $employee->forceFill(['active' => false])->save();

        $this->postJson('/api/login', [
            'employee_id' => $employee->id,
            'role' => 'cashier',
            'pin' => '123456',
        ], ['Origin' => 'http://localhost'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Invalid employee or PIN.');

        $this->assertGuest();
    }

    public function test_session_endpoint_returns_the_authenticated_employee_and_role(): void
    {
        $employee = $this->employeeWithPin('123456');

        $this->actingAs($employee)
            ->withSession(['active_role' => 'cashier'])
            ->getJson('/api/session', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonPath('employee.id', $employee->id)
            ->assertJsonPath('employee.name', $employee->name)
            ->assertJsonPath('active_role', 'cashier')
            ->assertJsonMissingPath('employee.email');
    }

    public function test_session_endpoint_rejects_guests(): void
    {
        $this->getJson('/api/session', ['Origin' => 'http://localhost'])->assertUnauthorized();
    }

    public function test_session_endpoint_revokes_an_inactive_employees_session(): void
    {
        $employee = $this->employeeWithPin('123456');
        $employee->forceFill(['active' => false])->save();

        $this->actingAs($employee)
            ->withSession(['active_role' => 'cashier'])
            ->getJson('/api/session', ['Origin' => 'http://localhost'])
            ->assertUnauthorized();

        $this->assertGuest('web');
        $this->assertFalse(session()->has('active_role'));
    }

    public function test_logout_invalidates_the_session_and_rotates_csrf_token(): void
    {
        $employee = $this->employeeWithPin('123456');
        $this->actingAs($employee)->withSession(['active_role' => 'cashier']);
        $csrfToken = session()->token();

        $this->postJson('/api/logout', [], ['Origin' => 'http://localhost'])
            ->assertNoContent();

        $this->assertGuest('web');
        $this->assertFalse(session()->has('active_role'));
        $this->assertNotSame($csrfToken, session()->token());
        $this->getJson('/api/session', ['Origin' => 'http://localhost'])->assertUnauthorized();
    }

    public function test_failed_pin_attempts_lock_employee_across_client_ips_for_fifteen_minutes(): void
    {
        $employee = $this->employeeWithPin('123456');

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.'.($attempt + 1)])
                ->postJson('/api/login', [
                    'employee_id' => $employee->id,
                    'role' => 'cashier',
                    'pin' => '654321',
                ], ['Origin' => 'http://localhost'])
                ->assertUnprocessable();
        }

        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.20'])
            ->postJson('/api/login', [
                'employee_id' => $employee->id,
                'role' => 'cashier',
                'pin' => '123456',
            ], ['Origin' => 'http://localhost'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Invalid employee or PIN.');

        $this->travel(15)->minutes();

        $this->postJson('/api/login', [
            'employee_id' => $employee->id,
            'role' => 'cashier',
            'pin' => '123456',
        ], ['Origin' => 'http://localhost'])->assertOk();
    }

    public function test_malformed_pin_requests_do_not_count_toward_account_lockout(): void
    {
        $employee = $this->employeeWithPin('123456');

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/login', [
                'employee_id' => $employee->id,
                'role' => 'cashier',
                'pin' => '12345',
            ], ['Origin' => 'http://localhost'])->assertUnprocessable();
        }

        $this->postJson('/api/login', [
            'employee_id' => $employee->id,
            'role' => 'cashier',
            'pin' => '123456',
        ], ['Origin' => 'http://localhost'])->assertOk();
    }

    public function test_login_options_only_list_active_employees_assigned_to_the_requested_role(): void
    {
        $cashier = $this->employeeWithPin('123456', 'cashier');
        $barista = $this->employeeWithPin('123456', 'barista');
        $inactive = $this->employeeWithPin('123456', 'cashier');
        $inactive->forceFill(['active' => false])->save();

        $this->getJson('/api/login-options?role=cashier', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertExactJson([
                'data' => [
                    ['id' => $cashier->id, 'name' => $cashier->name],
                ],
            ])
            ->assertJsonMissing(['email' => $cashier->email]);
    }

    public function test_login_options_reject_an_unknown_role(): void
    {
        $this->getJson('/api/login-options?role=owner', ['Origin' => 'http://localhost'])
            ->assertUnprocessable();
    }

    public function test_login_options_require_a_role(): void
    {
        $this->getJson('/api/login-options', ['Origin' => 'http://localhost'])
            ->assertUnprocessable();
    }

    public function test_login_and_login_options_are_limited_to_thirty_requests_per_minute_per_ip(): void
    {
        for ($attempt = 0; $attempt < 30; $attempt++) {
            $this->getJson('/api/login-options?role=cashier', ['Origin' => 'http://localhost'])
                ->assertOk();
        }

        $this->getJson('/api/login-options?role=cashier', ['Origin' => 'http://localhost'])
            ->assertTooManyRequests();
    }

    public function test_login_endpoint_is_limited_to_thirty_requests_per_minute_per_ip(): void
    {
        $employee = $this->employeeWithPin('123456');

        for ($attempt = 0; $attempt < 30; $attempt++) {
            $this->postJson('/api/login', [
                'employee_id' => $employee->id,
                'role' => 'cashier',
                'pin' => '12345',
            ], ['Origin' => 'http://localhost'])->assertUnprocessable();
        }

        $this->postJson('/api/login', [
            'employee_id' => $employee->id,
            'role' => 'cashier',
            'pin' => '12345',
        ], ['Origin' => 'http://localhost'])->assertTooManyRequests();
    }

    public function test_employee_provisioning_command_stores_only_hashed_credentials_and_selected_roles(): void
    {
        $this->artisan('mokapro:employee')
            ->expectsQuestion('Employee name', 'New Cashier')
            ->expectsQuestion('Employee email', 'new-cashier@example.test')
            ->expectsQuestion('Employee PIN', '123456')
            ->expectsChoice('Employee roles', ['cashier', 'barista'], Role::CODES)
            ->assertExitCode(0);

        $employee = User::query()->where('email', 'new-cashier@example.test')->firstOrFail();

        $this->assertTrue(Hash::check('123456', $employee->pin_hash));
        $this->assertTrue(Hash::isHashed($employee->password));
        $this->assertFalse(Hash::check('123456', $employee->password));
        $this->assertEqualsCanonicalizing(['cashier', 'barista'], $employee->roles()->pluck('code')->all());
    }

    private function employeeWithPin(string $pin, string $role = 'cashier'): User
    {
        $employee = User::factory()->create();
        $employee->forceFill(['pin_hash' => Hash::make($pin)])->save();
        $employee->roles()->attach(Role::query()->where('code', $role)->firstOrFail());

        return $employee->fresh();
    }
}
