<?php

namespace App\Services\Inventory;

use App\Exceptions\InsufficientStock;
use App\Exceptions\ReservationExpired;
use App\Models\Ingredient;
use App\Models\Order;
use App\Models\Restock;
use App\Models\StockMovement;
use App\Models\StockReservation;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use LogicException;

class RecipeInventoryService
{
    private const MAX_THOUSANDTHS = 99_999_999_999_999;

    public function recordRestock(string $reference, ?string $note, array $items, int $userId): Restock
    {
        return DB::transaction(function () use ($reference, $note, $items, $userId): Restock {
            $restock = Restock::query()->firstOrCreate(
                ['reference' => $reference],
                ['note' => $note, 'created_by' => $userId],
            );

            if (! $restock->wasRecentlyCreated) {
                if ($this->restockItemsInThousandths($restock) !== $this->payloadItemsInThousandths($items)) {
                    throw ValidationException::withMessages([
                        'reference' => 'This reference has already been used with different restock items.',
                    ]);
                }

                return $restock->load('items.ingredient');
            }

            $ingredientIds = array_column($items, 'ingredient_id');
            $ingredients = Ingredient::query()
                ->whereIn('id', $ingredientIds)
                ->where('active', true)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($ingredients->count() !== count($ingredientIds)) {
                throw ValidationException::withMessages([
                    'items' => 'Every restocked ingredient must exist and be active.',
                ]);
            }

            foreach ($items as $item) {
                $ingredient = $ingredients->get($item['ingredient_id']);
                $quantity = $this->toThousandths($item['quantity']);
                $actual = $this->toThousandths($ingredient->actual_quantity);
                if ($actual > self::MAX_THOUSANDTHS - $quantity) {
                    throw ValidationException::withMessages([
                        'items' => "Restocking ingredient {$ingredient->id} exceeds the supported quantity.",
                    ]);
                }
                $updatedActual = $actual + $quantity;

                $restock->items()->create([
                    'ingredient_id' => $ingredient->id,
                    'quantity' => $this->fromThousandths($quantity),
                ]);

                $ingredient->actual_quantity = $this->fromThousandths($updatedActual);
                $ingredient->save();

                StockMovement::query()->create([
                    'ingredient_id' => $ingredient->id,
                    'reference_type' => 'restock',
                    'reference_id' => (string) $restock->id,
                    'movement_type' => 'restock',
                    'delta' => $this->fromThousandths($quantity),
                ]);
            }

            return $restock->load('items.ingredient');
        }, 3);
    }

    public function reserveForOrder(Order $order, bool $allowProductsWithoutRecipe = false): void
    {
        DB::transaction(function () use ($order, $allowProductsWithoutRecipe): void {
            $order = Order::query()
                ->lockForUpdate()
                ->findOrFail($order->id)
                ->load('items.product.activeRecipe.recipeIngredients');

            if ($order->items->isEmpty()) {
                throw new LogicException("Order {$order->id} has no items to reserve.");
            }

            $required = [];
            foreach ($order->items as $item) {
                $product = $item->product;
                $recipe = $product?->activeRecipe;

                if (! $product?->active) {
                    throw new LogicException("Product on order {$order->id} is inactive.");
                }

                if ($recipe === null || $recipe->recipeIngredients->isEmpty()) {
                    if ($allowProductsWithoutRecipe) {
                        continue;
                    }

                    throw new LogicException("Product on order {$order->id} has no active recipe.");
                }

                if ($item->quantity < 1) {
                    throw new LogicException("Order {$order->id} has an invalid item quantity.");
                }

                foreach ($recipe->recipeIngredients as $recipeIngredient) {
                    $ingredientId = $recipeIngredient->ingredient_id;
                    $lineQuantity = $this->toThousandths($recipeIngredient->quantity);
                    $lineRequired = $this->checkedMultiply($lineQuantity, $item->quantity, $ingredientId);
                    $required[$ingredientId] = $this->checkedAdd(
                        $required[$ingredientId] ?? 0,
                        $lineRequired,
                        $ingredientId,
                    );
                }
            }

            if ($required === []) {
                return;
            }

            ksort($required);

            $existingReservations = StockReservation::query()
                ->where('order_id', $order->id)
                ->orderBy('ingredient_id')
                ->get();

            if ($existingReservations->isNotEmpty()) {
                if ($existingReservations->contains(
                    fn (StockReservation $reservation): bool => $reservation->status === StockReservation::STATUS_ACTIVE
                        && $reservation->expires_at->isPast(),
                )) {
                    throw new ReservationExpired($order->id);
                }

                if ($existingReservations->every(
                    fn (StockReservation $reservation): bool => $reservation->status === StockReservation::STATUS_ACTIVE
                        && $reservation->expires_at->isFuture(),
                )) {
                    return;
                }

                throw new LogicException("Order {$order->id} already has finalized stock reservations.");
            }

            $ingredients = Ingredient::query()
                ->whereIn('id', array_keys($required))
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($ingredients->count() !== count($required)) {
                throw new LogicException("A recipe ingredient for order {$order->id} no longer exists.");
            }

            foreach ($required as $ingredientId => $quantity) {
                $ingredient = $ingredients->get($ingredientId);

                if (! $ingredient->active) {
                    throw new LogicException("Ingredient {$ingredientId} is inactive.");
                }

                $available = $this->toThousandths($ingredient->actual_quantity)
                    - $this->activeReservationThousandths($ingredientId);
                if ($available < $quantity) {
                    throw new InsufficientStock((int) $ingredientId);
                }
            }

            $expiresAt = now()->addMinutes(10);
            foreach ($required as $ingredientId => $quantity) {
                StockReservation::query()->create([
                    'order_id' => $order->id,
                    'ingredient_id' => $ingredientId,
                    'quantity' => $this->fromThousandths($quantity),
                    'status' => StockReservation::STATUS_ACTIVE,
                    'expires_at' => $expiresAt,
                ]);
            }
        }, 3);
    }

    public function consumeForPayment(Order $order, string $paymentReference): void
    {
        if ($paymentReference === '' || strlen($paymentReference) > 191) {
            throw new \InvalidArgumentException('Payment reference must contain 1 to 191 characters.');
        }

        DB::transaction(function () use ($order, $paymentReference): void {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);
            $reservationIngredientIds = StockReservation::query()
                ->where('order_id', $order->id)
                ->where('status', StockReservation::STATUS_ACTIVE)
                ->orderBy('ingredient_id')
                ->pluck('ingredient_id')
                ->all();

            if ($reservationIngredientIds === []) {
                $alreadyConsumed = StockMovement::query()
                    ->where('reference_type', 'payment')
                    ->where('reference_id', $paymentReference)
                    ->where('movement_type', 'consumption')
                    ->where('order_id', $order->id)
                    ->exists();

                if ($alreadyConsumed) {
                    return;
                }

                throw new LogicException("Order {$order->id} has no active stock reservations.");
            }

            $ingredients = Ingredient::query()
                ->whereIn('id', $reservationIngredientIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');
            $reservations = StockReservation::query()
                ->where('order_id', $order->id)
                ->where('status', StockReservation::STATUS_ACTIVE)
                ->orderBy('ingredient_id')
                ->lockForUpdate()
                ->get();

            if ($reservations->contains(fn (StockReservation $reservation): bool => $reservation->expires_at->isPast())) {
                throw new ReservationExpired($order->id);
            }

            foreach ($reservations as $reservation) {
                $ingredient = $ingredients->get($reservation->ingredient_id);
                $quantity = $this->toThousandths($reservation->quantity);
                $actual = $this->toThousandths($ingredient->actual_quantity);

                if ($actual < $quantity) {
                    throw new InsufficientStock($ingredient->id);
                }

                $movement = StockMovement::query()->firstOrCreate(
                    [
                        'reference_type' => 'payment',
                        'reference_id' => $paymentReference,
                        'ingredient_id' => $ingredient->id,
                        'movement_type' => 'consumption',
                    ],
                    [
                        'order_id' => $order->id,
                        'delta' => '-'.$this->fromThousandths($quantity),
                    ],
                );

                if (! $movement->wasRecentlyCreated && (int) $movement->order_id !== $order->id) {
                    throw new LogicException('Payment reference is already used by another order.');
                }

                if ($movement->wasRecentlyCreated) {
                    $ingredient->actual_quantity = $this->fromThousandths($actual - $quantity);
                    $ingredient->save();
                }

                $reservation->status = StockReservation::STATUS_CONSUMED;
                $reservation->consumed_at = now();
                $reservation->save();
            }
        }, 3);
    }

    public function releaseForOrder(Order $order): void
    {
        DB::transaction(function () use ($order): void {
            Order::query()->lockForUpdate()->findOrFail($order->id);

            $reservations = StockReservation::query()
                ->where('order_id', $order->id)
                ->where('status', StockReservation::STATUS_ACTIVE)
                ->orderBy('ingredient_id')
                ->lockForUpdate()
                ->get();

            foreach ($reservations as $reservation) {
                $reservation->status = StockReservation::STATUS_RELEASED;
                $reservation->released_at = now();
                $reservation->save();
            }
        }, 3);
    }

    public function activeReservationThousandths(int $ingredientId): int
    {
        $query = StockReservation::query()
            ->where('ingredient_id', $ingredientId)
            ->where('status', StockReservation::STATUS_ACTIVE)
            ->where('expires_at', '>', now());

        if (DB::transactionLevel() > 0) {
            $query->lockForUpdate();
        }

        $reservations = $query->get(['quantity']);

        $total = 0;
        foreach ($reservations as $reservation) {
            $total = $this->checkedAdd($total, $this->toThousandths($reservation->quantity), $ingredientId);
        }

        return $total;
    }

    /**
     * @return array{data: array<int, array<string, int|string|bool>>, low_stock: array<int, array{id: int, code: string, name: string}>}
     */
    public function inventorySummary(): array
    {
        $rows = [];
        $lowStock = [];

        foreach (Ingredient::query()->orderBy('name')->get() as $ingredient) {
            $actual = $this->toThousandths($ingredient->actual_quantity);
            $reserved = $this->activeReservationThousandths($ingredient->id);
            $available = $actual - $reserved;
            $isLow = $available <= $this->toThousandths($ingredient->minimum_stock);
            $row = [
                'id' => $ingredient->id,
                'code' => $ingredient->code,
                'name' => $ingredient->name,
                'unit' => $ingredient->unit,
                'actual_quantity' => $this->fromThousandths($actual),
                'reserved_quantity' => $this->fromThousandths($reserved),
                'available_quantity' => $this->fromThousandths($available),
                'minimum_stock' => $ingredient->minimum_stock,
                'active' => $ingredient->active,
                'low_stock' => $isLow,
            ];
            $rows[] = $row;

            if ($isLow) {
                $lowStock[] = [
                    'id' => $ingredient->id,
                    'code' => $ingredient->code,
                    'name' => $ingredient->name,
                ];
            }
        }

        return ['data' => $rows, 'low_stock' => $lowStock];
    }

    private function toThousandths(string $value): int
    {
        if (! preg_match('/\A(\d{1,11})(?:\.(\d{1,3}))?\z/', $value, $matches)) {
            throw new LogicException("Invalid stored inventory quantity: {$value}");
        }

        $whole = (int) $matches[1];
        $fraction = (int) str_pad($matches[2] ?? '', 3, '0');

        return $whole * 1000 + $fraction;
    }

    private function fromThousandths(int $quantity): string
    {
        if ($quantity < 0 || $quantity > self::MAX_THOUSANDTHS) {
            throw new LogicException('Inventory quantity is outside the supported range.');
        }

        return intdiv($quantity, 1000).'.'.str_pad((string) ($quantity % 1000), 3, '0', STR_PAD_LEFT);
    }

    private function checkedAdd(int $left, int $right, int $ingredientId): int
    {
        if ($left > self::MAX_THOUSANDTHS - $right) {
            throw new InsufficientStock($ingredientId);
        }

        return $left + $right;
    }

    private function checkedMultiply(int $quantity, int $multiplier, int $ingredientId): int
    {
        if ($multiplier < 1 || $quantity > intdiv(self::MAX_THOUSANDTHS, $multiplier)) {
            throw new InsufficientStock($ingredientId);
        }

        return $quantity * $multiplier;
    }

    /**
     * @param  array<int, array{ingredient_id: int, quantity: string}>  $items
     * @return array<int, array{ingredient_id: int, quantity: int}>
     */
    private function payloadItemsInThousandths(array $items): array
    {
        $normalized = [];
        foreach ($items as $item) {
            $normalized[(int) $item['ingredient_id']] = $this->toThousandths($item['quantity']);
        }
        ksort($normalized);

        $result = [];
        foreach ($normalized as $ingredientId => $quantity) {
            $result[] = ['ingredient_id' => $ingredientId, 'quantity' => $quantity];
        }

        return $result;
    }

    /**
     * @return array<int, array{ingredient_id: int, quantity: int}>
     */
    private function restockItemsInThousandths(Restock $restock): array
    {
        $items = $restock->items()->orderBy('ingredient_id')->get(['ingredient_id', 'quantity']);

        return $items->map(fn ($item): array => [
            'ingredient_id' => (int) $item->ingredient_id,
            'quantity' => $this->toThousandths($item->quantity),
        ])->all();
    }
}
