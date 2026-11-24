<?php

namespace Tests\Feature\Api;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ShiftOpeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_cashier_can_open_only_one_shift_at_a_time(): void
    {
        $cashier = $this->asRole('cashier');
        $firstShift = $this->postJson('/api/shifts/open', [
            'opening_float' => '100.00',
        ], ['Origin' => 'http://localhost'])
            ->assertCreated()
            ->json('data');

        $this->postJson('/api/shifts/open', [
            'opening_float' => '50.00',
        ], ['Origin' => 'http://localhost'])->assertConflict();

        $this->getJson('/api/shifts/current', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonPath('data.id', $firstShift['id'])
            ->assertJsonPath('data.cashier_id', $cashier->id)
            ->assertJsonPath('data.opening_float', '100.00');

        $this->assertDatabaseCount('shifts', 1);
    }

    public function test_closed_shift_allows_the_cashier_to_open_another(): void
    {
        $this->asRole('cashier');
        $firstShift = $this->postJson('/api/shifts/open', [
            'opening_float' => '100.00',
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');
        DB::table('shifts')->where('id', $firstShift['id'])->update(['closed_at' => now()]);

        $secondShift = $this->postJson('/api/shifts/open', [
            'opening_float' => '75.50',
        ], ['Origin' => 'http://localhost'])
            ->assertCreated()
            ->json('data');

        $this->assertNotSame($firstShift['id'], $secondShift['id']);
        $this->assertDatabaseCount('shifts', 2);
        $this->getJson('/api/shifts/current', ['Origin' => 'http://localhost'])
            ->assertJsonPath('data.id', $secondShift['id']);
    }

    public function test_opening_float_must_be_a_non_negative_decimal_string(): void
    {
        $this->asRole('cashier');

        $this->postJson('/api/shifts/open', [
            'opening_float' => '-1.00',
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        $this->postJson('/api/shifts/open', [
            'opening_float' => 100.00,
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        $this->assertDatabaseCount('shifts', 0);
    }

    public function test_only_cashiers_can_open_shifts(): void
    {
        $this->asRole('admin');

        $this->postJson('/api/shifts/open', [
            'opening_float' => '100.00',
        ], ['Origin' => 'http://localhost'])->assertForbidden();
    }

    private function asRole(string $role): User
    {
        $employee = User::factory()->create();
        $employee->roles()->attach(Role::query()->where('code', $role)->firstOrFail());
        $this->actingAs($employee->fresh())->withSession(['active_role' => $role]);

        return $employee;
    }
}
