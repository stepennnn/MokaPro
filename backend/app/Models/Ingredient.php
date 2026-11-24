<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ingredient extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'minimum_stock' => 'decimal:3',
            'actual_quantity' => 'decimal:3',
            'active' => 'boolean',
        ];
    }

    public function recipeIngredients(): HasMany
    {
        return $this->hasMany(RecipeIngredient::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(StockReservation::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function restockItems(): HasMany
    {
        return $this->hasMany(RestockItem::class);
    }
}
