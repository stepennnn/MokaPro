<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restock_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('restock_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained()->restrictOnDelete();
            $table->decimal('quantity', 14, 3);
            $table->timestamps();
            $table->unique(['restock_id', 'ingredient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restock_items');
    }
};
