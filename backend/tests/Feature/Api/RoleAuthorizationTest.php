<?php

namespace Tests\Feature\Api;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class RoleAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware(['web', 'auth:web', 'role:admin'])
            ->match(['GET', 'POST'], '/api/test/admin-only', fn () => response()->json(['allowed' => true]));
    }

    public function test_guest_cannot_access_the_product_catalog(): void
    {
        $this->getJson('/api/products', ['Origin' => 'http://localhost'])->assertUnauthorized();
    }

    public function test_cashier_cannot_access_an_admin_only_route(): void
    {
        $this->asEmployeeWithRole('cashier')
            ->getJson('/api/test/admin-only', ['Origin' => 'http://localhost'])
            ->assertForbidden();
    }

    public function test_admin_can_access_an_admin_only_route(): void
    {
        $this->asEmployeeWithRole('admin')
            ->getJson('/api/test/admin-only', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonPath('allowed', true);
    }

    public function test_cashier_can_read_the_product_catalog(): void
    {
        $this->asEmployeeWithRole('cashier')
            ->getJson('/api/products', ['Origin' => 'http://localhost'])
            ->assertOk();
    }

    public function test_barista_cannot_create_cashier_orders(): void
    {
        $this->asEmployeeWithRole('barista')
            ->postJson('/api/orders', [], ['Origin' => 'http://localhost'])
            ->assertForbidden();
    }

    public function test_request_body_cannot_override_the_active_role(): void
    {
        $this->asEmployeeWithRole('cashier')
            ->postJson('/api/test/admin-only', ['role' => 'admin'], ['Origin' => 'http://localhost'])
            ->assertForbidden();
    }

    public function test_active_role_must_be_assigned_to_the_authenticated_employee(): void
    {
        $this->asEmployeeWithRole('cashier', 'admin')
            ->getJson('/api/test/admin-only', ['Origin' => 'http://localhost'])
            ->assertForbidden();
    }

    private function asEmployeeWithRole(string $assignedRole, ?string $activeRole = null): static
    {
        $employee = User::factory()->create();
        $employee->roles()->attach(
            Role::query()->where('code', $assignedRole)->firstOrFail(),
        );

        return $this->actingAs($employee)
            ->withSession(['active_role' => $activeRole ?? $assignedRole]);
    }
}
