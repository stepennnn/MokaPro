<?php

namespace Tests\Feature\Api;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TableAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_cashiers_read_the_eight_configured_active_tables_and_capacities(): void
    {
        $this->asRole('cashier');
        DB::table('tables')->insert([
            'code' => 'inactive-01',
            'name' => 'Inactive table',
            'capacity' => 2,
            'active' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $tables = $this->getJson('/api/tables', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->json('data');

        $this->assertCount(8, $tables);
        $this->assertSame([
            ['code' => 't1', 'name' => 'Meja 01', 'capacity' => 4],
            ['code' => 't2', 'name' => 'Meja 02', 'capacity' => 4],
            ['code' => 't3', 'name' => 'Meja 03', 'capacity' => 4],
            ['code' => 't4', 'name' => 'Meja 04', 'capacity' => 6],
            ['code' => 't5', 'name' => 'Meja 05', 'capacity' => 4],
            ['code' => 't6', 'name' => 'Bar Counter A', 'capacity' => 4],
            ['code' => 't7', 'name' => 'Outdoor 01', 'capacity' => 4],
            ['code' => 't8', 'name' => 'Outdoor 02', 'capacity' => 4],
        ], array_map(
            fn (array $table): array => [
                'code' => $table['code'],
                'name' => $table['name'],
                'capacity' => $table['capacity'],
            ],
            $tables,
        ));
    }

    public function test_table_reads_require_a_cashier_session(): void
    {
        $this->getJson('/api/tables', ['Origin' => 'http://localhost'])->assertUnauthorized();

        $this->asRole('barista');
        $this->getJson('/api/tables', ['Origin' => 'http://localhost'])->assertForbidden();
    }

    private function asRole(string $role): void
    {
        $employee = User::factory()->create();
        $employee->roles()->attach(Role::query()->where('code', $role)->firstOrFail());

        $this->actingAs($employee->fresh())
            ->withSession(['active_role' => $role]);
    }
}
