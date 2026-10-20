<?php

declare(strict_types=1);

namespace Proformas\Domain;

/**
 * Value Object para cálculo de horas y redondeo de jornadas a medio día superior (0.5).
 */
final class Hours
{
    public static function round(float $hours): float
    {
        return round($hours + 1e-9, 2, PHP_ROUND_HALF_UP);
    }

    /**
     * RN-04: Redondeo superior a múltiplos de 0.5 días.
     * Ej: 0.0 -> 0.0; 1.12 -> 1.5; 2.086 -> 2.5; 2.00 -> 2.0
     */
    public static function ceilHalfDay(float $rawDays): float
    {
        if ($rawDays <= 0.0) {
            return 0.0;
        }
        return ceil(round($rawDays * 2, 6)) / 2.0;
    }
}
