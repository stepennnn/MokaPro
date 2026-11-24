<?php

namespace App\Exceptions;

use RuntimeException;

class ReservationExpired extends RuntimeException
{
    public function __construct(int $orderId)
    {
        parent::__construct("Stock reservations for order {$orderId} have expired.");
    }
}
