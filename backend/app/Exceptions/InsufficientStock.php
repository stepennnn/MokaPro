<?php

namespace App\Exceptions;

use RuntimeException;

class InsufficientStock extends RuntimeException
{
    public function __construct(public readonly int $ingredientId)
    {
        parent::__construct("Ingredient {$ingredientId} has insufficient available stock.");
    }
}
