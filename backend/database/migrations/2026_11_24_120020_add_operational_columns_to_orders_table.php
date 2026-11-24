<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->string('status', 32)->default('Menunggu')->after('payment_method');
            $table->unsignedSmallInteger('seats')->nullable()->after('table_number');
            $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
            $table->foreignId('shift_id')->nullable()->after('user_id')->constrained('shifts')->nullOnDelete();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropIndex(['status', 'created_at']);
            $table->dropConstrainedForeignId('shift_id');
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn(['seats', 'status']);
        });
    }
};
