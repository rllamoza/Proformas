<?php

declare(strict_types=1);

namespace Proformas\Engine;

use Proformas\Domain\Hours;
use Proformas\Domain\Money;
use InvalidArgumentException;

/**
 * Motor puro de cálculo de proformas técnicas (sin dependencias de PDO ni HTTP).
 * Cumple estrictamente las reglas RN-01 a RN-10 y los 24 casos de prueba CAL-01..CAL-24.
 */
final class QuoteCalculator
{
    /**
     * RN-01: Determina el costo unitario vigente en PEN de un producto a partir de sus ofertas.
     *
     * @param array<int, array{
     *   currency: string,
     *   unit_cost: float,
     *   valid_until: ?string,
     *   is_preferred?: bool|int,
     *   is_active?: bool|int
     * }> $offers
     * @param array{usd_to_pen_sell: float, buffer_pct?: float} $exchangeRate
     * @param string $today Fecha YYYY-MM-DD
     */
    public static function resolveProductCostPen(array $offers, array $exchangeRate, string $today = '2026-06-15'): float
    {
        $validOffers = [];
        foreach ($offers as $offer) {
            $isActive = (bool) ($offer['is_active'] ?? true);
            if (!$isActive) {
                continue;
            }
            $validUntil = $offer['valid_until'] ?? null;
            if ($validUntil !== null && $validUntil < $today) {
                continue;
            }
            $validOffers[] = $offer;
        }

        if (empty($validOffers)) {
            throw new InvalidArgumentException('OFFER_EXPIRED: El producto no posee ninguna oferta vigente.');
        }

        $sellRate = (float) ($exchangeRate['usd_to_pen_sell'] ?? 3.75);
        $bufferPct = (float) ($exchangeRate['buffer_pct'] ?? 0.0);
        $effectiveUsdRate = $sellRate * (1.0 + ($bufferPct / 100.0));

        // Verificar si hay oferta preferida vigente
        foreach ($validOffers as $offer) {
            if (!empty($offer['is_preferred'])) {
                $rawCost = (float) $offer['unit_cost'];
                $penCost = ($offer['currency'] ?? 'USD') === 'USD'
                    ? $rawCost * $effectiveUsdRate
                    : $rawCost;
                return Money::round($penCost);
            }
        }

        // Caso general: menor costo vigente convertido a PEN
        $minPenCost = null;
        foreach ($validOffers as $offer) {
            $rawCost = (float) $offer['unit_cost'];
            $penCost = ($offer['currency'] ?? 'USD') === 'USD'
                ? $rawCost * $effectiveUsdRate
                : $rawCost;
            $rounded = Money::round($penCost);
            if ($minPenCost === null || $rounded < $minPenCost) {
                $minPenCost = $rounded;
            }
        }

        return $minPenCost ?? 0.0;
    }

    /**
     * Calcula el costo de materiales y horas unitarias de un ensamblaje con factor de dificultad.
     * RN-02: El factor de dificultad multiplica hours_cabling y hours_mounting, pero NO hours_config.
     *
     * @param array{
     *   components_cost_pen: float,
     *   fixed_supplies_cost_pen: float,
     *   hours_cabling: float,
     *   hours_mounting: float,
     *   hours_config: float,
     *   reference_cost_per_point: float
     * } $assembly
     */
    public static function calculateAssemblyUnit(array $assembly, float $difficultyFactor = 1.0): array
    {
        $unitMaterialsCost = Money::round(
            ((float) $assembly['components_cost_pen']) + ((float) $assembly['fixed_supplies_cost_pen'])
        );

        $cabling = Hours::round(((float) $assembly['hours_cabling']) * $difficultyFactor);
        $mounting = Hours::round(((float) $assembly['hours_mounting']) * $difficultyFactor);
        $config = Hours::round((float) $assembly['hours_config']);
        $totalHoursUnit = Hours::round($cabling + $mounting + $config);

        return [
            'unit_cost_pen' => $unitMaterialsCost,
            'hours_cabling_unit' => $cabling,
            'hours_mounting_unit' => $mounting,
            'hours_config_unit' => $config,
            'total_hours_unit' => $totalHoursUnit,
            'reference_labor_unit_pen' => Money::round((float) $assembly['reference_cost_per_point']),
        ];
    }

    /**
     * Calcula todos los totales económicos, horas, jornadas, comparativa de cuadrillas y alertas.
     *
     * @param array{
     *   lines: array<int, array{
     *     quantity: float,
     *     unit_cost_pen: float,
     *     hours_cabling_unit: float,
     *     hours_mounting_unit: float,
     *     hours_config_unit: float,
     *     reference_labor_unit_pen: float,
     *     difficulty_multiplier?: float,
     *     already_multiplied?: bool
     *   }>,
     *   crew_technicians?: int,
     *   crew_assistants?: int,
     *   labor_method?: string,
     *   overhead_pct?: float,
     *   target_margin_on_sale_pct?: float,
     *   discount_pct?: float,
     *   tax_pct?: float,
     *   service_lines?: array<int, array{
     *     quantity: int|float,
     *     unit_cost_pen?: float,
     *     unit_price_pen: float,
     *     is_included_in_quote_total?: bool|int
     *   }>,
     *   labor_params?: array{
     *     technician_day_cost_pen?: float,
     *     assistant_day_cost_pen?: float,
     *     effective_hours_per_day?: float,
     *     buffer_pct?: float,
     *     default_travel_cost_per_day_pen?: float,
     *     default_overhead_pct?: float,
     *     default_margin_on_sale_pct?: float,
     *     min_margin_on_sale_pct?: float,
     *     seller_max_discount_pct?: float,
     *     tax_pct?: float
     *   },
     *   crew_efficiencies?: array<int, float>
     * } $input
     */
    public static function calculateQuote(array $input): array
    {
        $params = array_merge([
            'technician_day_cost_pen' => 140.00,
            'assistant_day_cost_pen' => 90.00,
            'effective_hours_per_day' => 7.00,
            'buffer_pct' => 15.00,
            'default_travel_cost_per_day_pen' => 40.00,
            'default_overhead_pct' => 8.00,
            'default_margin_on_sale_pct' => 30.00,
            'min_margin_on_sale_pct' => 20.00,
            'seller_max_discount_pct' => 5.00,
            'tax_pct' => 18.00,
        ], $input['labor_params'] ?? []);

        $efficiencies = $input['crew_efficiencies'] ?? [
            1 => 100.0,
            2 => 100.0,
            3 => 90.0,
            4 => 80.0,
        ];

        $targetMarginPct = (float) ($input['target_margin_on_sale_pct'] ?? $params['default_margin_on_sale_pct']);
        if ($targetMarginPct >= 100.0 || $targetMarginPct < 0.0) {
            throw new InvalidArgumentException('INVALID_TARGET_MARGIN: El margen objetivo debe ser menor a 100% y mayor o igual a 0%.');
        }

        $overheadPct = (float) ($input['overhead_pct'] ?? $params['default_overhead_pct']);
        $discountPct = (float) ($input['discount_pct'] ?? 0.0);
        $taxPct = (float) ($input['tax_pct'] ?? $params['tax_pct']);
        $laborMethod = (string) ($input['labor_method'] ?? 'max_ab');

        $crewTechs = max(0, (int) ($input['crew_technicians'] ?? 1));
        $crewAssts = max(0, (int) ($input['crew_assistants'] ?? 1));
        $crewSize = max(1, $crewTechs + $crewAssts);
        $crewEffPct = (float) ($efficiencies[$crewSize] ?? ($crewSize > 4 ? 75.0 : 100.0));

        // 1. Acumulación de líneas (materiales, horas y método A)
        $materialsCostPen = 0.0;
        $totalHoursCabling = 0.0;
        $totalHoursMounting = 0.0;
        $totalHoursConfig = 0.0;
        $laborMethodAPen = 0.0;
        $calculatedLines = [];

        foreach ($input['lines'] ?? [] as $line) {
            $qty = (float) ($line['quantity'] ?? 1.0);
            $unitCost = (float) ($line['unit_cost_pen'] ?? 0.0);
            $diff = (float) ($line['difficulty_multiplier'] ?? 1.0);
            $alreadyMultiplied = (bool) ($line['already_multiplied'] ?? false);

            $hCablingUnit = $alreadyMultiplied
                ? (float) ($line['hours_cabling_unit'] ?? 0.0)
                : Hours::round(((float) ($line['hours_cabling_unit'] ?? 0.0)) * $diff);
            $hMountingUnit = $alreadyMultiplied
                ? (float) ($line['hours_mounting_unit'] ?? 0.0)
                : Hours::round(((float) ($line['hours_mounting_unit'] ?? 0.0)) * $diff);
            $hConfigUnit = Hours::round((float) ($line['hours_config_unit'] ?? 0.0));

            $lineMaterials = Money::round($qty * $unitCost);
            $lineCabling = Hours::round($qty * $hCablingUnit);
            $lineMounting = Hours::round($qty * $hMountingUnit);
            $lineConfig = Hours::round($qty * $hConfigUnit);
            $lineHours = Hours::round($lineCabling + $lineMounting + $lineConfig);
            $refLaborUnit = (float) ($line['reference_labor_unit_pen'] ?? 0.0);
            $lineMethodA = Money::round($qty * $refLaborUnit);

            $materialsCostPen = Money::round($materialsCostPen + $lineMaterials);
            $totalHoursCabling = Hours::round($totalHoursCabling + $lineCabling);
            $totalHoursMounting = Hours::round($totalHoursMounting + $lineMounting);
            $totalHoursConfig = Hours::round($totalHoursConfig + $lineConfig);
            $laborMethodAPen = Money::round($laborMethodAPen + $lineMethodA);

            $calculatedLines[] = array_merge($line, [
                'line_materials_cost_pen' => $lineMaterials,
                'line_total_hours' => $lineHours,
                'line_method_a_pen' => $lineMethodA,
            ]);
        }

        $totalHours = Hours::round($totalHoursCabling + $totalHoursMounting + $totalHoursConfig);

        // 2. Método B: Cálculo por cuadrilla y jornadas (RN-03 y RN-04)
        $dailyCapacityHours = Hours::round(
            $crewSize * ((float) $params['effective_hours_per_day']) * ($crewEffPct / 100.0)
        );

        $rawDaysWithBuffer = ($totalHours > 0.0 && $dailyCapacityHours > 0.0)
            ? ($totalHours / $dailyCapacityHours) * (1.0 + (((float) $params['buffer_pct']) / 100.0))
            : 0.0;

        $estimatedDays = Hours::ceilHalfDay($rawDaysWithBuffer);

        $dailyCrewCostPen = Money::round(
            ($crewTechs * ((float) $params['technician_day_cost_pen'])) +
            ($crewAssts * ((float) $params['assistant_day_cost_pen']))
        );

        $laborMethodBPen = Money::round($estimatedDays * $dailyCrewCostPen);

        // 3. RN-05: Selección de Mano de Obra aplicada
        $laborAppliedPen = match ($laborMethod) {
            'method_a' => $laborMethodAPen,
            'method_b' => $laborMethodBPen,
            default => max($laborMethodAPen, $laborMethodBPen),
        };

        // 4. Viáticos, Costo Directo, Gastos Generales y Costo Total (RN-06)
        $travelCostPen = Money::round($estimatedDays * ((float) $params['default_travel_cost_per_day_pen']));
        $directCostPen = Money::round($materialsCostPen + $laborAppliedPen + $travelCostPen);
        $overheadAmountPen = Money::round($directCostPen * ($overheadPct / 100.0));
        $totalCostPen = Money::round($directCostPen + $overheadAmountPen);

        // 5. Valor de venta antes de descuento (RN-07: margen sobre venta Costo / (1 - m))
        $saleValueBeforeDiscountPen = $totalCostPen > 0.0
            ? Money::round($totalCostPen / (1.0 - ($targetMarginPct / 100.0)))
            : 0.0;

        // 6. Servicios recurrentes incluidos o informativos (CAL-23 y CAL-24)
        $includedServicesSalePen = 0.0;
        $includedServicesCostPen = 0.0;
        $informativeServicesSalePen = 0.0;
        foreach ($input['service_lines'] ?? [] as $srv) {
            $srvQty = (float) ($srv['quantity'] ?? 1);
            $srvPrice = Money::round($srvQty * ((float) ($srv['unit_price_pen'] ?? 0.0)));
            $srvCost = Money::round($srvQty * ((float) ($srv['unit_cost_pen'] ?? 0.0)));
            if (!empty($srv['is_included_in_quote_total'])) {
                $includedServicesSalePen = Money::round($includedServicesSalePen + $srvPrice);
                $includedServicesCostPen = Money::round($includedServicesCostPen + $srvCost);
            } else {
                $informativeServicesSalePen = Money::round($informativeServicesSalePen + $srvPrice);
            }
        }

        $saleValueBeforeDiscountPen = Money::round($saleValueBeforeDiscountPen + $includedServicesSalePen);
        $effectiveTotalCostPen = Money::round($totalCostPen + $includedServicesCostPen);

        // 7. Descuento comercial, Base Imponible, IGV y Total con IGV
        $discountAmountPen = Money::round($saleValueBeforeDiscountPen * ($discountPct / 100.0));
        $taxableBasePen = Money::round($saleValueBeforeDiscountPen - $discountAmountPen);
        $taxAmountPen = Money::round($taxableBasePen * ($taxPct / 100.0));
        $totalWithTaxPen = Money::round($taxableBasePen + $taxAmountPen);

        // 8. Margen efectivo sobre venta
        $effectiveMarginPct = $taxableBasePen > 0.0
            ? Money::round((($taxableBasePen - $effectiveTotalCostPen) / $taxableBasePen) * 100.0)
            : 0.0;

        // 9. Prorrateo de precios de venta por línea para vistas comerciales sin revelar costos
        $factorPrice = $materialsCostPen > 0.0
            ? ($taxableBasePen / $materialsCostPen)
            : 1.0;

        foreach ($calculatedLines as &$cLine) {
            $qty = max(0.01, (float) ($cLine['quantity'] ?? 1.0));
            $lineSale = Money::round($cLine['line_materials_cost_pen'] * $factorPrice);
            $cLine['unit_price_pen'] = Money::round($lineSale / $qty);
            $cLine['line_sale_subtotal_pen'] = $lineSale;
        }
        unset($cLine);

        // 10. Comparador automático de cuadrillas (2, 3 y 4 personas - RF-PRO-05)
        $crewComparison = self::buildCrewComparison(
            $totalHours,
            $params,
            $efficiencies
        );

        // 11. Reglas de alertas y requerimiento de aprobación (RN-08)
        $alerts = [];
        $requiresApproval = false;

        if ($discountPct > (float) $params['seller_max_discount_pct']) {
            $requiresApproval = true;
            $alerts[] = [
                'code' => 'DISCOUNT_ABOVE_LIMIT',
                'level' => 'warning',
                'message' => sprintf(
                    'El descuento solicitado (%.2f%%) supera el límite autónomo del vendedor (%.2f%%). Requiere aprobación de Gerencia.',
                    $discountPct,
                    (float) $params['seller_max_discount_pct']
                ),
            ];
        }

        if ($taxableBasePen > 0.0 && $effectiveMarginPct < (float) $params['min_margin_on_sale_pct']) {
            $requiresApproval = true;
            $alerts[] = [
                'code' => 'MARGIN_BELOW_MIN',
                'level' => 'danger',
                'message' => sprintf(
                    'El margen efectivo (%.2f%%) es inferior al margen mínimo permitido (%.2f%%). Requiere aprobación de Gerencia.',
                    $effectiveMarginPct,
                    (float) $params['min_margin_on_sale_pct']
                ),
            ];
        }

        return [
            'crew_technicians' => $crewTechs,
            'crew_assistants' => $crewAssts,
            'crew_size' => $crewSize,
            'crew_efficiency_pct' => $crewEffPct,
            'daily_capacity_hours' => $dailyCapacityHours,
            'daily_crew_cost_pen' => $dailyCrewCostPen,
            'labor_method' => $laborMethod,
            'total_hours_cabling' => $totalHoursCabling,
            'total_hours_mounting' => $totalHoursMounting,
            'total_hours_config' => $totalHoursConfig,
            'total_hours' => $totalHours,
            'estimated_days' => $estimatedDays,
            'materials_cost_pen' => $materialsCostPen,
            'labor_cost_method_a_pen' => $laborMethodAPen,
            'labor_cost_method_b_pen' => $laborMethodBPen,
            'labor_cost_applied_pen' => $laborAppliedPen,
            'travel_cost_pen' => $travelCostPen,
            'direct_cost_pen' => $directCostPen,
            'overhead_pct' => $overheadPct,
            'overhead_amount_pen' => $overheadAmountPen,
            'total_cost_pen' => $effectiveTotalCostPen,
            'target_margin_on_sale_pct' => $targetMarginPct,
            'sale_value_before_discount_pen' => $saleValueBeforeDiscountPen,
            'discount_pct' => $discountPct,
            'discount_amount_pen' => $discountAmountPen,
            'taxable_base_pen' => $taxableBasePen,
            'tax_pct' => $taxPct,
            'tax_amount_pen' => $taxAmountPen,
            'total_with_tax_pen' => $totalWithTaxPen,
            'effective_margin_on_sale_pct' => $effectiveMarginPct,
            'informative_services_sale_pen' => $informativeServicesSalePen,
            'requires_approval' => $requiresApproval,
            'alerts' => $alerts,
            'crew_comparison' => $crewComparison,
            'lines' => $calculatedLines,
        ];
    }

    /**
     * Genera la tabla comparativa para 2 personas (1T+1A), 3 personas (1T+2A) y 4 personas (2T+2A).
     */
    private static function buildCrewComparison(float $totalHours, array $params, array $efficiencies): array
    {
        $configs = [
            ['crew_size' => 2, 'technicians' => 1, 'assistants' => 1, 'label' => '1 Técnico + 1 Ayudante'],
            ['crew_size' => 3, 'technicians' => 1, 'assistants' => 2, 'label' => '1 Técnico + 2 Ayudantes'],
            ['crew_size' => 4, 'technicians' => 2, 'assistants' => 2, 'label' => '2 Técnicos + 2 Ayudantes'],
        ];

        $result = [];
        foreach ($configs as $cfg) {
            $size = $cfg['crew_size'];
            $eff = (float) ($efficiencies[$size] ?? 100.0);
            $cap = Hours::round($size * ((float) $params['effective_hours_per_day']) * ($eff / 100.0));
            $rawDays = ($totalHours > 0.0 && $cap > 0.0)
                ? ($totalHours / $cap) * (1.0 + (((float) $params['buffer_pct']) / 100.0))
                : 0.0;
            $days = Hours::ceilHalfDay($rawDays);
            $dayCost = Money::round(
                ($cfg['technicians'] * ((float) $params['technician_day_cost_pen'])) +
                ($cfg['assistants'] * ((float) $params['assistant_day_cost_pen']))
            );
            $methodBCost = Money::round($days * $dayCost);

            $result[] = [
                'crew_size' => $size,
                'label' => $cfg['label'],
                'technicians' => $cfg['technicians'],
                'assistants' => $cfg['assistants'],
                'efficiency_pct' => $eff,
                'daily_capacity_hours' => $cap,
                'estimated_days' => $days,
                'daily_cost_pen' => $dayCost,
                'labor_cost_method_b_pen' => $methodBCost,
            ];
        }

        return $result;
    }
}
