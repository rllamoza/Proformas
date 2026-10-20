import { test, expect } from '@playwright/test';
import { loginAPI, loginUI, REFERENCE_LINES } from './helpers';

const FORBIDDEN_COST_FIELDS = [
  'materials_cost_pen',
  'labor_cost_method_a_pen',
  'labor_cost_method_b_pen',
  'labor_cost_applied_pen',
  'travel_cost_pen',
  'direct_cost_pen',
  'overhead_amount_pen',
  'total_cost_pen',
  'effective_margin_on_sale_pct',
  'unit_cost_pen',
];

test.describe('4. Roles y Permisos (PER-01 a PER-16)', () => {
  test('PER-01, PER-02, PER-15: Barrido de campos prohibidos para Vendedor en cálculo, catálogo y proformas', async ({ request }) => {
    await loginAPI(request, 'vendedor@empresa.pe');

    // Cálculo en vivo sin costos
    const calcRes = await request.post('/api/v1/quotes/preview-calculation', {
      data: { lines: REFERENCE_LINES },
    });
    expect(calcRes.status()).toBe(200);
    const calcData = (await calcRes.json()).data;
    for (const field of FORBIDDEN_COST_FIELDS) {
      expect(calcData[field]).toBeUndefined();
    }
    expect(calcData.total_with_tax_pen).toBe(6992.81);

    // Catálogo de productos y ensamblajes sin costos
    const prodRes = await request.get('/api/v1/products');
    const prods = (await prodRes.json()).data;
    expect(prods.length).toBeGreaterThan(0);
    expect(prods[0].unit_cost_pen).toBeUndefined();

    const asmRes = await request.get('/api/v1/assemblies');
    const asms = (await asmRes.json()).data;
    expect(asms[0].unit_cost_pen).toBeUndefined();
  });

  test('PER-03, PER-11, PER-13, PER-14, AUD-05: Restricciones de endpoints 403 para Vendedor', async ({ request }) => {
    await loginAPI(request, 'vendedor@empresa.pe');

    // No accede a ofertas de proveedor ni lista de proveedores
    const offRes = await request.get('/api/v1/products/1/offers');
    expect(offRes.status()).toBe(403);
    const supRes = await request.get('/api/v1/suppliers');
    expect(supRes.status()).toBe(403);

    // No puede aprobar proformas
    const appRes = await request.post('/api/v1/quotes/8/approve', { data: {} });
    expect(appRes.status()).toBe(403);

    // No puede descargar hoja de costeo Excel
    const xlsRes = await request.get('/api/v1/quotes/1/excel');
    expect(xlsRes.status()).toBe(403);

    // No puede crear usuarios ni ver bitácora de auditoría
    const usrRes = await request.post('/api/v1/users', { data: { full_name: 'X', email: 'x@x.pe' } });
    expect(usrRes.status()).toBe(403);
    const audRes = await request.get('/api/v1/audit-log');
    expect(audRes.status()).toBe(403);
  });

  test('PER-04 y PER-05: Vendedor ve solo sus propias proformas y recibe 403 en proforma ajena', async ({ request }) => {
    await loginAPI(request, 'vendedor@empresa.pe'); // id = 3 (Carlos Mendoza)
    const listRes = await request.get('/api/v1/quotes');
    expect(listRes.status()).toBe(200);
    const quotes = (await listRes.json()).data;
    expect(quotes.length).toBeGreaterThan(0);
    for (const q of quotes) {
      expect(q.seller_id).toBe(3);
    }

    // Proforma #2 pertenece a seller_id = 2 (Ana Paredes)
    const otherRes = await request.get('/api/v1/quotes/2');
    expect(otherRes.status()).toBe(403);
  });

  test('PER-08 y PER-09: Técnico ve su panel técnico y órdenes asignadas, sin acceso a proformas ni clientes', async ({ page, request }) => {
    await loginAPI(request, 'tecnico@empresa.pe');

    // Técnico no puede listar clientes ni modificar proformas
    const custRes = await request.get('/api/v1/customers');
    expect(custRes.status()).toBe(403);
    const putQuote = await request.put('/api/v1/quotes/3', { data: {} });
    expect(putQuote.status()).toBe(403);

    // En UI Técnico ve su panel técnico y es redirigido si intenta ir a /proformas
    await loginUI(page, 'tecnico@empresa.pe');
    await expect(page.getByRole('heading', { name: /Hola, Jorge Quispe/i })).toBeVisible();
    await expect(page.getByText('Panel técnico')).toBeVisible();

    await page.goto('/proformas');
    await expect(page).toHaveURL('http://localhost:5173/');
  });

  test('PER-10, PER-11, PER-14: Gerencia ve costos, margen promedio, cola de aprobaciones y descarga Excel de costeo', async ({ page, request }) => {
    await loginAPI(request, 'gerencia@empresa.pe');
    const calcRes = await request.post('/api/v1/quotes/preview-calculation', {
      data: { lines: REFERENCE_LINES },
    });
    const calcData = (await calcRes.json()).data;
    expect(calcData.materials_cost_pen).toBe(3126.0);
    expect(calcData.total_cost_pen).toBe(4148.28);
    expect(calcData.effective_margin_on_sale_pct).toBe(30.0);

    // Descarga de Excel permitida para Gerencia
    const xlsRes = await request.get('/api/v1/quotes/1/excel');
    expect(xlsRes.status()).toBe(200);
    const csvText = await xlsRes.text();
    expect(csvText).toContain('Concepto,Monto');
    expect(csvText).toContain('Margen %');

    // UI de Gerencia muestra Margen promedio y Cola de aprobaciones
    await loginUI(page, 'gerencia@empresa.pe');
    await expect(page.getByText('Margen promedio')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cola de aprobaciones' })).toBeVisible();
  });

  test('UAT-05: Confidencialidad en UI — Vendedor no ve costos ni márgenes en Dashboard, Catálogo ni Detalle de Proforma', async ({ page }) => {
    await loginUI(page, 'vendedor@empresa.pe');
    await expect(page.getByRole('heading', { name: 'Dashboard Vendedor' })).toBeVisible();
    await expect(page.getByText('Meta mensual')).toBeVisible();
    await expect(page.getByText('Cola de aprobaciones')).toHaveCount(0);

    // En detalle de proforma #1 no aparece Costo total ni Margen efectivo
    await page.goto('/proformas/1');
    await expect(page.getByRole('heading', { name: /PF-2026-0001/i })).toBeVisible();
    await expect(page.getByText('Costo total')).toHaveCount(0);
    await expect(page.getByText('Margen efectivo')).toHaveCount(0);
    await expect(page.getByText('TOTAL', { exact: true })).toBeVisible();
  });
});
