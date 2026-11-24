<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Modifier extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
        ];
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_modifiers')->withTimestamps();
    }
}
