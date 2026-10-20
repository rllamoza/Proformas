import { test, expect } from '@playwright/test';
import { loginAPI, loginUI, REFERENCE_LINES } from './helpers';

test.describe('2. Motor de Cálculo Financiero y Técnico (CAL-01 a CAL-24)', () => {
  test('CAL-01: Proforma de referencia (Casa de 2 pisos) verifica todos los montos exactos al céntimo', async ({ request }) => {
    await loginAPI(request, 'gerencia@empresa.pe');
    const res = await request.post('/api/v1/quotes/preview-calculation', {
      data: {
        lines: REFERENCE_LINES,
        zones: [{ id: 1, name: 'Zona 1', difficulty_factor: 1.0 }],
        crew_technicians: 1,
        crew_assistants: 1,
        labor_method: 'max_ab',
        overhead_pct: 8.0,
        target_margin_on_sale_pct: 30.0,
        discount_pct: 0.0,
      },
    });
    expect(res.status()).toBe(200);
    const { data } = await res.json();

    expect(data.materials_cost_pen).toBe(3126.0);
    expect(data.total_hours_cabling).toBe(6.2);
    expect(data.total_hours_mounting).toBe(12.5);
    expect(data.total_hours_config).toBe(6.7);
    expect(data.total_hours).toBe(25.4);
    expect(data.estimated_days).toBe(2.5);
    expect(data.labor_cost_method_a_pen).toBe(615.0);
    expect(data.labor_cost_method_b_pen).toBe(575.0);
    expect(data.labor_cost_applied_pen).toBe(615.0);
    expect(data.travel_cost_pen).toBe(100.0);
    expect(data.direct_cost_pen).toBe(3841.0);
    expect(data.overhead_amount_pen).toBe(307.28);
    expect(data.total_cost_pen).toBe(4148.28);
    expect(data.sale_value_before_discount_pen).toBe(5926.11);
    expect(data.taxable_base_pen).toBe(5926.11);
    expect(data.tax_amount_pen).toBe(1066.7);
    expect(data.total_with_tax_pen).toBe(6992.81);
    expect(data.effective_margin_on_sale_pct).toBe(30.0);
    expect(data.requires_approval).toBe(false);
  });

  test('CAL-02, CAL-03 y CAL-06: Costos vigentes de productos, oferta preferida y ensamblaje ASM-CAM-EXT', async ({ request }) => {
    await loginAPI(request, 'admin@empresa.pe');
    const prodsRes = await request.get('/api/v1/products');
    expect(prodsRes.status()).toBe(200);
    const prods = (await prodsRes.json()).data;
    const cam = prods.find((p: any) => p.sku === 'CAM-BUL-4MP');
    expect(cam.unit_cost_pen).toBe(142.5); // 38 USD * 3.75

    const asmRes = await request.get('/api/v1/assemblies');
    expect(asmRes.status()).toBe(200);
    const asms = (await asmRes.json()).data;
    const asmCam = asms.find((a: any) => a.code === 'ASM-CAM-EXT');
    expect(asmCam.unit_cost_pen).toBe(223.5);
  });

  test('CAL-07: Factor de dificultad 1.25x en zona afecta cableado y montaje pero no configuración (4.25 h)', async ({ request }) => {
    await loginAPI(request, 'gerencia@empresa.pe');
    const res = await request.post('/api/v1/quotes/preview-calculation', {
      data: {
        zones: [{ id: 1, name: 'Fachada', difficulty_factor: 1.25 }],
        lines: [{ assembly_id: 1, quantity: 1, zone_name: 'Fachada' }],
        crew_technicians: 1,
        crew_assistants: 1,
      },
    });
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.total_hours_cabling).toBe(1.25);
    expect(data.total_hours_mounting).toBe(2.5);
    expect(data.total_hours_config).toBe(0.5);
    expect(data.total_hours).toBe(4.25);
  });

  test('CAL-08, CAL-09, CAL-10: Comparador de cuadrillas (2, 3 y 4 personas)', async ({ request }) => {
    await loginAPI(request, 'gerencia@empresa.pe');
    const res = await request.post('/api/v1/quotes/preview-calculation', {
      data: {
        lines: REFERENCE_LINES,
        zones: [{ id: 1, name: 'Zona 1', difficulty_factor: 1.0 }],
        crew_technicians: 1,
        crew_assistants: 1,
      },
    });
    const { data } = await res.json();
    const comp = data.crew_comparison;
    expect(comp).toHaveLength(3);

    // 2 personas: 14.0 h/día, 2.5 días, S/ 575.00
    expect(comp[0].daily_capacity_hours).toBe(14.0);
    expect(comp[0].estimated_days).toBe(2.5);
    expect(comp[0].labor_cost_method_b_pen).toBe(575.0);

    // 3 personas: 18.9 h/día, 2.0 días, S/ 640.00
    expect(comp[1].daily_capacity_hours).toBe(18.9);
    expect(comp[1].estimated_days).toBe(2.0);
    expect(comp[1].labor_cost_method_b_pen).toBe(640.0);

    // 4 personas: 22.4 h/día, 1.5 días, S/ 690.00
    expect(comp[2].daily_capacity_hours).toBe(22.4);
    expect(comp[2].estimated_days).toBe(1.5);
    expect(comp[2].labor_cost_method_b_pen).toBe(690.0);
  });

  test('CAL-12, CAL-13: Regla A/B (max_ab vs method_b forzado vs method_a)', async ({ request }) => {
    await loginAPI(request, 'gerencia@empresa.pe');
    const resB = await request.post('/api/v1/quotes/preview-calculation', {
      data: {
        lines: REFERENCE_LINES,
        zones: [{ id: 1, name: 'Zona 1', difficulty_factor: 1.0 }],
        labor_method: 'method_b',
      },
    });
    const dataB = (await resB.json()).data;
    expect(dataB.labor_cost_applied_pen).toBe(575.0);
    expect(dataB.direct_cost_pen).toBe(3801.0);

    const resA = await request.post('/api/v1/quotes/preview-calculation', {
      data: {
        lines: REFERENCE_LINES,
        zones: [{ id: 1, name: 'Zona 1', difficulty_factor: 1.0 }],
        crew_technicians: 1,
        crew_assistants: 2,
        labor_method: 'method_a',
      },
    });
    const dataA = (await resA.json()).data;
    expect(dataA.labor_cost_applied_pen).toBe(615.0);
  });

  test('CAL-16, CAL-17, CAL-18, CAL-21: Descuentos (5%, 10%, 20%), redondeo y alertas de aprobación', async ({ request }) => {
    await loginAPI(request, 'gerencia@empresa.pe');

    // CAL-16 & CAL-21: Descuento 5% -> 296.3055 redondea a 296.31, sin aprobación
    const r5 = await request.post('/api/v1/quotes/preview-calculation', {
      data: { lines: REFERENCE_LINES, discount_pct: 5.0 },
    });
    const d5 = (await r5.json()).data;
    expect(d5.discount_amount_pen).toBe(296.31);
    expect(d5.taxable_base_pen).toBe(5629.8);
    expect(d5.tax_amount_pen).toBe(1013.36);
    expect(d5.total_with_tax_pen).toBe(6643.16);
    expect(d5.effective_margin_on_sale_pct).toBe(26.32);
    expect(d5.requires_approval).toBe(false);

    // CAL-17: Descuento 10% -> requiere aprobación (DISCOUNT_ABOVE_LIMIT)
    const r10 = await request.post('/api/v1/quotes/preview-calculation', {
      data: { lines: REFERENCE_LINES, discount_pct: 10.0 },
    });
    const d10 = (await r10.json()).data;
    expect(d10.discount_amount_pen).toBe(592.61);
    expect(d10.taxable_base_pen).toBe(5333.5);
    expect(d10.tax_amount_pen).toBe(960.03);
    expect(d10.total_with_tax_pen).toBe(6293.53);
    expect(d10.effective_margin_on_sale_pct).toBe(22.22);
    expect(d10.requires_approval).toBe(true);
    expect(d10.alerts.some((a: any) => a.code === 'DISCOUNT_ABOVE_LIMIT')).toBe(true);

    // CAL-18: Descuento 20% -> margen 12.50% bajo el mínimo (MARGIN_BELOW_MIN)
    const r20 = await request.post('/api/v1/quotes/preview-calculation', {
      data: { lines: REFERENCE_LINES, discount_pct: 20.0 },
    });
    const d20 = (await r20.json()).data;
    expect(d20.discount_amount_pen).toBe(1185.22);
    expect(d20.taxable_base_pen).toBe(4740.89);
    expect(d20.effective_margin_on_sale_pct).toBe(12.5);
    expect(d20.requires_approval).toBe(true);
    expect(d20.alerts.some((a: any) => a.code === 'MARGIN_BELOW_MIN')).toBe(true);
  });

  test('CAL-19, CAL-23, CAL-24: Servicios recurrentes informativos vs incluidos y proforma en UI Wizard', async ({ page, request }) => {
    await loginAPI(request, 'gerencia@empresa.pe');
    const rSvc = await request.post('/api/v1/quotes/preview-calculation', {
      data: {
        lines: REFERENCE_LINES,
        service_lines: [
          { quantity: 1, unit_cost_pen: 120.0, unit_price_pen: 250.0, is_included_in_quote_total: false },
        ],
      },
    });
    const dSvc = (await rSvc.json()).data;
    expect(dSvc.total_with_tax_pen).toBe(6992.81);
    expect(dSvc.informative_services_sale_pen).toBe(250.0);

    // Verificar en UI que el Resumen Económico muestra el cálculo en vivo
    await loginUI(page, 'gerencia@empresa.pe');
    await page.goto('/proformas/nueva');
    await expect(page.getByRole('heading', { name: 'Resumen económico' })).toBeVisible();
    await expect(page.getByText('S/ 0.00').first()).toBeVisible();
  });
});
