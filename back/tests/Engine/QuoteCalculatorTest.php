<?php

declare(strict_types=1);

namespace Proformas\Tests\Engine;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Proformas\Engine\QuoteCalculator;
use Proformas\Http\Resources\RoleSanitizer;

final class QuoteCalculatorTest extends TestCase
{
    private function getReferenceLines(): array
    {
        return [
            [
                'code' => 'ASM-CAM-EXT',
                'quantity' => 4,
                'unit_cost_pen' => 223.50,
                'hours_cabling_unit' => 1.00,
                'hours_mounting_unit' => 2.00,
                'hours_config_unit' => 0.50,
                'reference_labor_unit_pen' => 70.00,
                'difficulty_multiplier' => 1.00,
            ],
            [
                'code' => 'ASM-AP',
                'quantity' => 2,
                'unit_cost_pen' => 315.00,
                'hours_cabling_unit' => 0.80,
                'hours_mounting_unit' => 1.25,
                'hours_config_unit' => 0.60,
                'reference_labor_unit_pen' => 55.00,
                'difficulty_multiplier' => 1.00,
            ],
            [
                'code' => 'ASM-NVR',
                'quantity' => 1,
                'unit_cost_pen' => 680.00,
                'hours_cabling_unit' => 0.20,
                'hours_mounting_unit' => 0.50,
                'hours_config_unit' => 1.50,
                'reference_labor_unit_pen' => 80.00,
                'difficulty_multiplier' => 1.00,
            ],
            [
                'code' => 'ASM-SW8',
                'quantity' => 1,
                'unit_cost_pen' => 342.00,
                'hours_cabling_unit' => 0.20,
                'hours_mounting_unit' => 0.50,
                'hours_config_unit' => 1.00,
                'reference_labor_unit_pen' => 55.00,
                'difficulty_multiplier' => 1.00,
            ],
            [
                'code' => 'ASM-VP-CASA',
                'quantity' => 1,
                'unit_cost_pen' => 580.00,
                'hours_cabling_unit' => 0.20,
                'hours_mounting_unit' => 1.00,
                'hours_config_unit' => 1.00,
                'reference_labor_unit_pen' => 90.00,
                'difficulty_multiplier' => 1.00,
            ],
        ];
    }

    public function testCal01ReferenceQuoteComplete(): void
    {
        $res = QuoteCalculator::calculateQuote([
            'lines' => $this->getReferenceLines(),
            'crew_technicians' => 1,
            'crew_assistants' => 1,
            'labor_method' => 'max_ab',
            'overhead_pct' => 8.00,
            'target_margin_on_sale_pct' => 30.00,
            'discount_pct' => 0.00,
        ]);

        self::assertSame(3126.00, $res['materials_cost_pen']);
        self::assertSame(25.40, $res['total_hours']);
        self::assertSame(2.5, $res['estimated_days']);
        self::assertSame(615.00, $res['labor_cost_method_a_pen']);
        self::assertSame(575.00, $res['labor_cost_method_b_pen']);
        self::assertSame(615.00, $res['labor_cost_applied_pen']);
        self::assertSame(100.00, $res['travel_cost_pen']);
        self::assertSame(3841.00, $res['direct_cost_pen']);
        self::assertSame(307.28, $res['overhead_amount_pen']);
        self::assertSame(4148.28, $res['total_cost_pen']);
        self::assertSame(5926.11, $res['sale_value_before_discount_pen']);
        self::assertSame(1066.70, $res['tax_amount_pen']);
        self::assertSame(6992.81, $res['total_with_tax_pen']);
        self::assertSame(30.00, $res['effective_margin_on_sale_pct']);
        self::assertFalse($res['requires_approval']);
    }

    public function testCal02ToCal05SupplierOfferResolution(): void
    {
        $offers = [
            ['currency' => 'USD', 'unit_cost' => 38.00, 'valid_until' => '2026-12-31', 'is_preferred' => 0],
            ['currency' => 'USD', 'unit_cost' => 41.00, 'valid_until' => '2026-12-31', 'is_preferred' => 0],
        ];
        // CAL-02: menor oferta 38 * 3.75 = 142.50
        self::assertSame(142.50, QuoteCalculator::resolveProductCostPen($offers, ['usd_to_pen_sell' => 3.75]));

        // CAL-03: oferta preferida 41 * 3.75 = 153.75
        $offersPref = $offers;
        $offersPref[1]['is_preferred'] = 1;
        self::assertSame(153.75, QuoteCalculator::resolveProductCostPen($offersPref, ['usd_to_pen_sell' => 3.75]));

        // CAL-04: buffer cambiario 2% -> 3.75 * 1.02 = 3.825 * 38 = 145.35
        self::assertSame(145.35, QuoteCalculator::resolveProductCostPen($offers, [
            'usd_to_pen_sell' => 3.75,
            'buffer_pct' => 2.00,
        ]));

        // CAL-05: oferta vencida lanza excepción
        $this->expectException(InvalidArgumentException::class);
        QuoteCalculator::resolveProductCostPen([
            ['currency' => 'USD', 'unit_cost' => 35.00, 'valid_until' => '2025-01-01'],
        ], ['usd_to_pen_sell' => 3.75], '2026-06-15');
    }

    public function testCal16ToCal18DiscountsAndApprovals(): void
    {
        // CAL-16: 5% descuento autónomo
        $cal16 = QuoteCalculator::calculateQuote([
            'lines' => $this->getReferenceLines(),
            'discount_pct' => 5.00,
        ]);
        self::assertSame(296.31, $cal16['discount_amount_pen']);
        self::assertSame(5629.80, $cal16['taxable_base_pen']);
        self::assertSame(6643.16, $cal16['total_with_tax_pen']);
        self::assertSame(26.32, $cal16['effective_margin_on_sale_pct']);
        self::assertFalse($cal16['requires_approval']);

        // CAL-17: 10% descuento -> requiere aprobación por superar 5%
        $cal17 = QuoteCalculator::calculateQuote([
            'lines' => $this->getReferenceLines(),
            'discount_pct' => 10.00,
        ]);
        self::assertSame(592.61, $cal17['discount_amount_pen']);
        self::assertSame(5333.50, $cal17['taxable_base_pen']);
        self::assertSame(6293.53, $cal17['total_with_tax_pen']);
        self::assertSame(22.22, $cal17['effective_margin_on_sale_pct']);
        self::assertTrue($cal17['requires_approval']);

        // CAL-18: 20% descuento -> margen bajo mínimo (12.50% < 20%)
        $cal18 = QuoteCalculator::calculateQuote([
            'lines' => $this->getReferenceLines(),
            'discount_pct' => 20.00,
        ]);
        self::assertSame(1185.22, $cal18['discount_amount_pen']);
        self::assertSame(4740.89, $cal18['taxable_base_pen']);
        self::assertSame(12.50, $cal18['effective_margin_on_sale_pct']);
        self::assertTrue($cal18['requires_approval']);
    }

    public function testRoleSanitizerStripsSensitiveFieldsForSeller(): void
    {
        $res = QuoteCalculator::calculateQuote(['lines' => $this->getReferenceLines()]);
        $sanitized = RoleSanitizer::sanitizePayload($res, 'vendedor');

        self::assertArrayNotHasKey('materials_cost_pen', $sanitized);
        self::assertArrayNotHasKey('total_cost_pen', $sanitized);
        self::assertArrayNotHasKey('effective_margin_on_sale_pct', $sanitized);
        self::assertArrayHasKey('total_with_tax_pen', $sanitized);
    }
}
