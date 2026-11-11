<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    // Relasi: 1 Order punya banyak OrderItem
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}