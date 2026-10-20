<?php

declare(strict_types=1);

namespace Proformas\Http\Resources;

/**
 * Serializador de recursos con filtrado estricto de campos sensibles según rol (09_Matriz_Roles_Permisos.md).
 * Regla de Oro: 'vendedor' y 'tecnico' NUNCA reciben campos de costo ni margen en el JSON.
 */
final class RoleSanitizer
{
    private const FORBIDDEN_QUOTE_FIELDS = [
        'materials_cost_pen',
        'labor_cost_method_a_pen',
        'labor_cost_method_b_pen',
        'labor_cost_applied_pen',
        'travel_cost_pen',
        'direct_cost_pen',
        'overhead_pct',
        'overhead_amount_pen',
        'total_cost_pen',
        'target_margin_on_sale_pct',
        'effective_margin_on_sale_pct',
        'daily_crew_cost_pen',
        'unit_cost_pen',
        'line_materials_cost_pen',
        'line_method_a_pen',
        'reference_labor_unit_pen',
        'reference_cost_per_point',
        'fixed_supplies_cost_pen',
        'components_cost_pen',
        'supplies_cost_pen',
    ];

    public static function canSeeCosts(string $role): bool
    {
        return in_array($role, ['gerencia', 'admin'], true);
    }

    public static function sanitizePayload(mixed $data, string $role): mixed
    {
        if (self::canSeeCosts($role)) {
            return $data;
        }

        if (!is_array($data)) {
            return $data;
        }

        $result = [];
        foreach ($data as $key => $value) {
            if (is_string($key) && in_array($key, self::FORBIDDEN_QUOTE_FIELDS, true)) {
                continue;
            }
            if ($key === 'crew_comparison' && is_array($value)) {
                $result[$key] = array_map(static function (array $row): array {
                    unset($row['daily_cost_pen'], $row['labor_cost_method_b_pen']);
                    return $row;
                }, $value);
                continue;
            }
            $result[$key] = is_array($value) ? self::sanitizePayload($value, $role) : $value;
        }

        return $result;
    }
}
