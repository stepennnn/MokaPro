<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            ['name' => 'Espresso Double', 'category' => 'Espresso Based', 'price' => 22000],
            ['name' => 'Caffe Latte', 'category' => 'Espresso Based', 'price' => 28000],
            ['name' => 'Kopi Susu Gula Aren', 'category' => 'Espresso Based', 'price' => 25000],
            ['name' => 'Matcha Latte', 'category' => 'Non-Coffee', 'price' => 30000],
            ['name' => 'V60 Single Origin', 'category' => 'Manual Brew', 'price' => 32000],
            ['name' => 'Butter Croissant', 'category' => 'Pastry & Food', 'price' => 24000],
        ];

        foreach ($products as $product) {
            $category = Category::firstOrCreate(['name' => $product['category']]);
            $code = 'SEED-'.Str::upper(Str::slug($product['name'], '-'));

            Product::firstOrCreate(
                ['code' => $code],
                $product + [
                    'code' => $code,
                    'category_id' => $category->id,
                    'active' => true,
                ],
            );
        }
    }
}
