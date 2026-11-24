<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tables', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 64)->unique();
            $table->string('name');
            $table->unsignedInteger('capacity')->default(4);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        $now = now();
        DB::table('tables')->insert([
            ['code' => 't1', 'name' => 'Meja 01', 'capacity' => 4, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 't2', 'name' => 'Meja 02', 'capacity' => 4, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 't3', 'name' => 'Meja 03', 'capacity' => 4, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 't4', 'name' => 'Meja 04', 'capacity' => 6, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 't5', 'name' => 'Meja 05', 'capacity' => 4, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 't6', 'name' => 'Bar Counter A', 'capacity' => 4, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 't7', 'name' => 'Outdoor 01', 'capacity' => 4, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 't8', 'name' => 'Outdoor 02', 'capacity' => 4, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('tables');
    }
};
