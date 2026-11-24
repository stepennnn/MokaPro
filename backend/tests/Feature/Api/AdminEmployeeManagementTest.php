<?php

namespace Tests\Feature\Api;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminEmployeeManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_users_cannot_manage_employees(): void
    {
        $this->getJson('/api/admin/users', ['Origin' => 'http://localhost'])->assertUnauthorized();

        $this->asRole('cashier');
        $this->getJson('/api/admin/users', ['Origin' => 'http://localhost'])->assertForbidden();
        $this->postJson('/api/admin/users', [
            'name' => 'Unauthorized',
            'role' => 'cashier',
            'pin' => '123456',
        ], ['Origin' => 'http://localhost'])->assertForbidden();

        $this->asRole('barista');
        $this->getJson('/api/admin/users', ['Origin' => 'http://localhost'])->assertForbidden();
    }

    public function test_admin_can_crud_employees_and_reset_pin_clearing_lockout(): void
    {
        $admin = $this->asRole('admin');

        // 1. Create employee without email (auto-generated) & 6-digit PIN
        $created = $this->postJson('/api/admin/users', [
            'name' => 'Kasir Baru',
            'role' => 'cashier',
            'pin' => '654321',
        ], ['Origin' => 'http://localhost'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Kasir Baru')
            ->assertJsonPath('data.role', 'cashier')
            ->assertJsonPath('data.active', true)
            ->assertJsonMissingPath('data.pin_hash')
            ->assertJsonMissingPath('data.password')
            ->json('data');

        $this->assertNotEmpty($created['email']);

        // 2. List employees never exposes pin_hash or password
        $listResponse = $this->getJson('/api/admin/users', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonCount(2, 'data');

        foreach ($listResponse->json('data') as $row) {
            $this->assertArrayNotHasKey('pin_hash', $row);
            $this->assertArrayNotHasKey('password', $row);
        }

        // 3. Invalid PIN format (5 digits or non-numeric) rejected with 422
        $this->postJson('/api/admin/users', [
            'name' => 'Invalid PIN',
            'role' => 'cashier',
            'pin' => '12345',
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        $this->patchJson('/api/admin/users/'.$created['id'].'/pin', [
            'pin' => '12ab56',
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        // 4. Update employee name, role, and active status
        $this->patchJson('/api/admin/users/'.$created['id'], [
            'name' => 'Barista Senior',
            'role' => 'barista',
            'active' => true,
        ], ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Barista Senior')
            ->assertJsonPath('data.role', 'barista');

        // 5. Admin cannot deactivate self or demote self role
        $this->patchJson('/api/admin/users/'.$admin->id, [
            'active' => false,
        ], ['Origin' => 'http://localhost'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('active');

        $this->patchJson('/api/admin/users/'.$admin->id, [
            'role' => 'cashier',
        ], ['Origin' => 'http://localhost'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('role');

        // 6. Trigger 5 failed PIN logins to lock out the employee
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', [
                'employee_id' => $created['id'],
                'role' => 'barista',
                'pin' => '000000',
            ], ['Origin' => 'http://localhost'])->assertUnprocessable();
        }

        // Locked out even with old correct PIN
        $this->postJson('/api/login', [
            'employee_id' => $created['id'],
            'role' => 'barista',
            'pin' => '654321',
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        // 7. Admin resets PIN -> clears lockout and allows login with new PIN
        $this->actingAs($admin->fresh())->withSession(['active_role' => 'admin']);
        $this->patchJson('/api/admin/users/'.$created['id'].'/pin', [
            'pin' => '987654',
        ], ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonMissingPath('data.pin_hash');

        $this->postJson('/api/login', [
            'employee_id' => $created['id'],
            'role' => 'barista',
            'pin' => '987654',
        ], ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonPath('employee.id', $created['id'])
            ->assertJsonPath('active_role', 'barista');
    }

    private function asRole(string $role): User
    {
        $employee = User::factory()->create();
        $employee->roles()->attach(Role::query()->where('code', $role)->firstOrFail());
        $this->actingAs($employee->fresh())->withSession(['active_role' => $role]);

        return $employee;
    }
}
