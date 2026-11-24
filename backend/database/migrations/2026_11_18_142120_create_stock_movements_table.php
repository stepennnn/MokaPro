<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('ingredient_id')->constrained()->restrictOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('reference_type', 32);
            $table->string('reference_id', 191);
            $table->string('movement_type', 32);
            $table->decimal('delta', 14, 3);
            $table->timestamps();
            $table->unique(
                ['reference_type', 'reference_id', 'ingredient_id', 'movement_type'],
                'stock_movements_idempotency_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
