<?php

declare(strict_types=1);

namespace Proformas\Domain;

/**
 * Value Object para manejo aritmético monetario con redondeo half-up a 2 decimales (centavos).
 */
final class Money
{
    public static function round(float $amount): float
    {
        return round($amount + 1e-9 * ($amount >= 0 ? 1 : -1), 2, PHP_ROUND_HALF_UP);
    }

    public static function toCents(float $amount): int
    {
        return (int) round($amount * 100, 0, PHP_ROUND_HALF_UP);
    }

    public static function fromCents(int $cents): float
    {
        return round($cents / 100, 2);
    }

    public static function formatPen(float $amount): string
    {
        return 'S/ ' . number_format(self::round($amount), 2, '.', ',');
    }
}
