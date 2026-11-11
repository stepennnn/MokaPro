<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

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
            Product::create($product);
        }
    }
}