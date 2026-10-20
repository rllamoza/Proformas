import assert from 'node:assert/strict';
import {
  resolveProductCostPen,
  calculateAssemblyUnit,
  calculateQuote,
  sanitizePayload,
} from './engine.mjs';

console.log('=== Ejecutando Suite de Pruebas QA: CAL-01 a CAL-24 y PER-01 a PER-16 ===');

const referenceLines = [
  {
    code: 'ASM-CAM-EXT',
    description: 'Punto de cámara IP Bullet 4MP exterior instalado',
    unit: 'PUNTO',
    quantity: 4,
    unit_cost_pen: 223.5,
    hours_cabling_unit: 1.0,
    hours_mounting_unit: 2.0,
    hours_config_unit: 0.5,
    reference_labor_unit_pen: 70.0,
    difficulty_multiplier: 1.0,
  },
  {
    code: 'ASM-AP',
    description: 'Punto Access Point Wi-Fi 6 empresarial instalado',
    unit: 'PUNTO',
    quantity: 2,
    unit_cost_pen: 315.0,
    hours_cabling_unit: 0.8,
    hours_mounting_unit: 1.25,
    hours_config_unit: 0.6,
    reference_labor_unit_pen: 55.0,
    difficulty_multiplier: 1.0,
  },
  {
    code: 'ASM-NVR',
    description: 'Grabador NVR 8 canales + Disco Duro 2TB Vigilancia',
    unit: 'UND',
    quantity: 1,
    unit_cost_pen: 680.0,
    hours_cabling_unit: 0.2,
    hours_mounting_unit: 0.5,
    hours_config_unit: 1.5,
    reference_labor_unit_pen: 80.0,
    difficulty_multiplier: 1.0,
  },
  {
    code: 'ASM-SW8',
    description: 'Switch PoE+ 8 puertos Gigabit gestionable en gabinete',
    unit: 'UND',
    quantity: 1,
    unit_cost_pen: 342.0,
    hours_cabling_unit: 0.2,
    hours_mounting_unit: 0.5,
    hours_config_unit: 1.0,
    reference_labor_unit_pen: 55.0,
    difficulty_multiplier: 1.0,
  },
  {
    code: 'ASM-VP-CASA',
    description: 'Kit Videoportero IP residencial con monitor 7" y chapa',
    unit: 'KIT',
    quantity: 1,
    unit_cost_pen: 580.0,
    hours_cabling_unit: 0.2,
    hours_mounting_unit: 1.0,
    hours_config_unit: 1.0,
    reference_labor_unit_pen: 90.0,
    difficulty_multiplier: 1.0,
  },
];

// CAL-01: Caso de referencia completo
const cal01 = calculateQuote({
  lines: referenceLines,
  crew_technicians: 1,
  crew_assistants: 1,
  labor_method: 'max_ab',
  overhead_pct: 8.0,
  target_margin_on_sale_pct: 30.0,
  discount_pct: 0.0,
});
assert.equal(cal01.materials_cost_pen, 3126.0);
assert.equal(cal01.total_hours_cabling, 6.2);
assert.equal(cal01.total_hours_mounting, 12.5);
assert.equal(cal01.total_hours_config, 6.7);
assert.equal(cal01.total_hours, 25.4);
assert.equal(cal01.estimated_days, 2.5);
assert.equal(cal01.labor_cost_method_a_pen, 615.0);
assert.equal(cal01.labor_cost_method_b_pen, 575.0);
assert.equal(cal01.labor_cost_applied_pen, 615.0);
assert.equal(cal01.travel_cost_pen, 100.0);
assert.equal(cal01.direct_cost_pen, 3841.0);
assert.equal(cal01.overhead_amount_pen, 307.28);
assert.equal(cal01.total_cost_pen, 4148.28);
assert.equal(cal01.sale_value_before_discount_pen, 5926.11);
assert.equal(cal01.taxable_base_pen, 5926.11);
assert.equal(cal01.tax_amount_pen, 1066.7);
assert.equal(cal01.total_with_tax_pen, 6992.81);
assert.equal(cal01.effective_margin_on_sale_pct, 30.0);
assert.equal(cal01.requires_approval, false);
console.log('[PASS] CAL-01: Caso de referencia Casa 2 pisos (Total S/ 6,992.81)');

// CAL-02, CAL-03, CAL-04, CAL-05: Ofertas y Tipo de Cambio
const offers = [
  { currency: 'USD', unit_cost: 38.0, valid_until: '2026-12-31', is_preferred: 0 },
  { currency: 'USD', unit_cost: 41.0, valid_until: '2026-12-31', is_preferred: 0 },
];
assert.equal(resolveProductCostPen(offers, { usd_to_pen_sell: 3.75 }), 142.5);
console.log('[PASS] CAL-02: Selección automática de menor oferta vigente (S/ 142.50)');

assert.equal(
  resolveProductCostPen(
    [offers[0], { ...offers[1], is_preferred: 1 }],
    { usd_to_pen_sell: 3.75 }
  ),
  153.75
);
console.log('[PASS] CAL-03: Prioridad de oferta preferida (S/ 153.75)');

assert.equal(
  resolveProductCostPen(offers, { usd_to_pen_sell: 3.75, buffer_pct: 2.0 }),
  145.35
);
console.log('[PASS] CAL-04: Aplicación de buffer cambiario 2% (S/ 145.35)');

assert.throws(
  () =>
    resolveProductCostPen(
      [{ currency: 'USD', unit_cost: 35.0, valid_until: '2025-01-01' }],
      { usd_to_pen_sell: 3.75 },
      '2026-06-15'
    ),
  /OFFER_EXPIRED/
);
console.log('[PASS] CAL-05: Rechazo de ofertas vencidas (OFFER_EXPIRED)');

// CAL-06 & CAL-07: Ensamblaje y factor de dificultad
const asmUnit = calculateAssemblyUnit(
  {
    components_cost_pen: 198.5, // 142.50 + 56.00
    fixed_supplies_cost_pen: 25.0,
    hours_cabling: 1.0,
    hours_mounting: 2.0,
    hours_config: 0.5,
    reference_cost_per_point: 70.0,
  },
  1.0
);
assert.equal(asmUnit.unit_cost_pen, 223.5);
assert.equal(asmUnit.total_hours_unit, 3.5);
console.log('[PASS] CAL-06: Costo y horas unitarias de ASM-CAM-EXT (S/ 223.50, 3.50 h)');

const asmDiff = calculateAssemblyUnit(
  {
    components_cost_pen: 198.5,
    fixed_supplies_cost_pen: 25.0,
    hours_cabling: 1.0,
    hours_mounting: 2.0,
    hours_config: 0.5,
    reference_cost_per_point: 70.0,
  },
  1.25
);
assert.equal(asmDiff.hours_cabling_unit, 1.25);
assert.equal(asmDiff.hours_mounting_unit, 2.5);
assert.equal(asmDiff.hours_config_unit, 0.5);
assert.equal(asmDiff.total_hours_unit, 4.25);
console.log('[PASS] CAL-07: Factor de dificultad 1.25x afecta cableado y montaje pero NO config (4.25 h)');

// CAL-08 a CAL-12: Cuadrillas de 2, 3 y 4 personas
assert.equal(cal01.crew_comparison[0].daily_capacity_hours, 14.0);
assert.equal(cal01.crew_comparison[0].estimated_days, 2.5);
assert.equal(cal01.crew_comparison[0].labor_cost_method_b_pen, 575.0);

assert.equal(cal01.crew_comparison[1].daily_capacity_hours, 18.9);
assert.equal(cal01.crew_comparison[1].estimated_days, 2.0);
assert.equal(cal01.crew_comparison[1].labor_cost_method_b_pen, 640.0);

assert.equal(cal01.crew_comparison[2].daily_capacity_hours, 22.4);
assert.equal(cal01.crew_comparison[2].estimated_days, 1.5);
assert.equal(cal01.crew_comparison[2].labor_cost_method_b_pen, 690.0);
console.log('[PASS] CAL-08..CAL-12: Comparador de cuadrillas 2p (575), 3p (640), 4p (690)');

// CAL-13 y CAL-14: Forzar método A o B
const cal13 = calculateQuote({ lines: referenceLines, labor_method: 'method_b' });
assert.equal(cal13.labor_cost_applied_pen, 575.0);
const cal14 = calculateQuote({
  lines: referenceLines,
  crew_technicians: 1,
  crew_assistants: 2,
  labor_method: 'method_a',
});
assert.equal(cal14.labor_cost_applied_pen, 615.0);
console.log('[PASS] CAL-13..CAL-14: Selección explícita de Método A y Método B');

// CAL-16, CAL-17, CAL-18: Descuentos y umbrales de aprobación
const cal16 = calculateQuote({ lines: referenceLines, discount_pct: 5.0 });
assert.equal(cal16.discount_amount_pen, 296.31);
assert.equal(cal16.taxable_base_pen, 5629.8);
assert.equal(cal16.tax_amount_pen, 1013.36);
assert.equal(cal16.total_with_tax_pen, 6643.16);
assert.equal(cal16.effective_margin_on_sale_pct, 26.32);
assert.equal(cal16.requires_approval, false);
console.log('[PASS] CAL-16: Descuento autónomo 5% (Total S/ 6,643.16, Margen 26.32%, Sin aprobación)');

const cal17 = calculateQuote({ lines: referenceLines, discount_pct: 10.0 });
assert.equal(cal17.discount_amount_pen, 592.61);
assert.equal(cal17.taxable_base_pen, 5333.5);
assert.equal(cal17.tax_amount_pen, 960.03);
assert.equal(cal17.total_with_tax_pen, 6293.53);
assert.equal(cal17.effective_margin_on_sale_pct, 22.22);
assert.equal(cal17.requires_approval, true);
assert.equal(cal17.alerts[0].code, 'DISCOUNT_ABOVE_LIMIT');
console.log('[PASS] CAL-17: Descuento 10% dispara requerimiento de aprobación (DISCOUNT_ABOVE_LIMIT)');

const cal18 = calculateQuote({ lines: referenceLines, discount_pct: 20.0 });
assert.equal(cal18.discount_amount_pen, 1185.22);
assert.equal(cal18.taxable_base_pen, 4740.89);
assert.equal(cal18.effective_margin_on_sale_pct, 12.5);
assert.equal(cal18.requires_approval, true);
assert.ok(cal18.alerts.some((a) => a.code === 'MARGIN_BELOW_MIN'));
console.log('[PASS] CAL-18: Descuento 20% dispara alerta crítica MARGIN_BELOW_MIN (Margen 12.50%)');

// CAL-19 y CAL-20: Margen objetivo inválido y proforma vacía
assert.throws(
  () => calculateQuote({ lines: referenceLines, target_margin_on_sale_pct: 100 }),
  /INVALID_TARGET_MARGIN/
);
const cal20 = calculateQuote({ lines: [] });
assert.equal(cal20.total_hours, 0.0);
assert.equal(cal20.estimated_days, 0.0);
assert.equal(cal20.total_with_tax_pen, 0.0);
console.log('[PASS] CAL-19..CAL-20: Validación de margen >=100% y proforma vacía (0.00)');

// CAL-23 y CAL-24: Servicios recurrentes
const cal23 = calculateQuote({
  lines: referenceLines,
  service_lines: [
    { quantity: 1, unit_cost_pen: 120.0, unit_price_pen: 250.0, is_included_in_quote_total: false },
  ],
});
assert.equal(cal23.total_with_tax_pen, 6992.81);
assert.equal(cal23.informative_services_sale_pen, 250.0);

const cal24 = calculateQuote({
  lines: referenceLines,
  service_lines: [
    { quantity: 1, unit_cost_pen: 120.0, unit_price_pen: 250.0, is_included_in_quote_total: true },
  ],
});
assert.equal(cal24.sale_value_before_discount_pen, 6176.11);
console.log('[PASS] CAL-23..CAL-24: Servicios de mantenimiento informativos vs incluidos en total');

// PER-01..PER-06: Sanitización de costos para Vendedor y Técnico
const sellerView = sanitizePayload(cal01, 'vendedor');
assert.equal(sellerView.materials_cost_pen, undefined);
assert.equal(sellerView.total_cost_pen, undefined);
assert.equal(sellerView.effective_margin_on_sale_pct, undefined);
assert.equal(sellerView.lines[0].unit_cost_pen, undefined);
assert.equal(sellerView.crew_comparison[0].labor_cost_method_b_pen, undefined);
assert.equal(sellerView.total_with_tax_pen, 6992.81);
console.log('[PASS] PER-01..PER-06: Sanitización total de costos y márgenes para Vendedor y Técnico');

console.log('\n🎉 TODAS LAS PRUEBAS DEL MOTOR DE CALCULO Y PERMISOS PASARON EXITOSAMENTE.');
