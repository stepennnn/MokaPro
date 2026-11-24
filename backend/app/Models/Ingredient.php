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
            'active' => 'boolean',
        ];
    }

    public function recipeIngredients(): HasMany
    {
        return $this->hasMany(RecipeIngredient::class);
    }
}
