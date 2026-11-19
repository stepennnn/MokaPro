<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EmployeeRoleMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_have_multiple_roles_without_exposing_pin_hash(): void
    {
        $user = User::factory()->create();
        $user->refresh();
        $this->assertTrue($user->active);

        $cashier = Role::query()->where('code', 'cashier')->firstOrFail();
        $admin = Role::query()->where('code', 'admin')->firstOrFail();

        $user->roles()->attach([$cashier->id, $admin->id]);
        $user->forceFill(['pin_hash' => Hash::make('123456')])->save();

        $serializedUser = $user->fresh()->toArray();

        $this->assertTrue($user->fresh()->hasRole('cashier'));
        $this->assertTrue($user->fresh()->hasRole('admin'));
        $this->assertArrayNotHasKey('pin_hash', $serializedUser);
    }
}
