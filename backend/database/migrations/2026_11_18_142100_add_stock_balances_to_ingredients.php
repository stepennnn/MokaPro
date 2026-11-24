<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ingredients', function (Blueprint $table): void {
            $table->decimal('actual_quantity', 14, 3)->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('ingredients', function (Blueprint $table): void {
            $table->dropColumn('actual_quantity');
        });
    }
};
