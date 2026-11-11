<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique(); // ORD-1234
            $table->string('type'); // Dine-In atau Takeaway
            $table->string('table_number')->nullable(); // Meja 01
            $table->decimal('subtotal', 12, 2);
            $table->decimal('tax', 12, 2); // Pajak 10%
            $table->decimal('total', 12, 2);
            $table->string('payment_method'); // qris atau cash
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};