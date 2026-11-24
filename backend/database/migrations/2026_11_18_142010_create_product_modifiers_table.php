<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_modifiers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('modifier_id')->constrained()->restrictOnDelete();
            $table->timestamps();
            $table->unique(['product_id', 'modifier_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_modifiers');
    }
};
