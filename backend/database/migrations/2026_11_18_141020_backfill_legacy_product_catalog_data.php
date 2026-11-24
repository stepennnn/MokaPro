<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function (): void {
            DB::table('products')
                ->distinct()
                ->orderBy('category')
                ->pluck('category')
                ->each(function (string $name): void {
                    DB::table('categories')->insertOrIgnore([
                        'name' => $name,
                        'active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                });

            DB::table('products')->orderBy('id')->chunkById(500, function ($products): void {
                foreach ($products as $product) {
                    $categoryId = DB::table('categories')
                        ->where('name', $product->category)
                        ->value('id');

                    if ($categoryId === null) {
                        throw new RuntimeException("No category found for legacy product {$product->id}.");
                    }

                    DB::table('products')->where('id', $product->id)->update([
                        'code' => 'LEGACY-'.$product->id,
                        'category_id' => $categoryId,
                        'active' => true,
                    ]);
                }
            });
        });

        Schema::table('products', function (Blueprint $table): void {
            $table->string('code')->nullable(false)->change();
            $table->unsignedBigInteger('category_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->string('code')->nullable()->change();
            $table->unsignedBigInteger('category_id')->nullable()->change();
        });
    }
};
