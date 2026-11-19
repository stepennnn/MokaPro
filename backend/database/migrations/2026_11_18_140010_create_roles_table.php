<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->timestamps();
        });

        $timestamp = now();

        DB::table('roles')->insertOrIgnore([
            ['code' => 'cashier', 'name' => 'Cashier', 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['code' => 'barista', 'name' => 'Barista', 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['code' => 'admin', 'name' => 'Admin', 'created_at' => $timestamp, 'updated_at' => $timestamp],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
