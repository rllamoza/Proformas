import { test, expect } from '@playwright/test';
import { loginAPI, loginUI, REFERENCE_LINES } from './helpers';

test.describe('8, 9 & 11. Visitas Técnicas, Órdenes de Trabajo, Reportes SUNAT/SPOT y No Funcionales (VIS, OT, NFR)', () => {
  test('VIS-01: Registrar punto de levantamiento con metraje de cable, adjuntar fotografía y convertir visita en Proforma desde UI', async ({ page }) => {
    await loginUI(page, 'gerencia@empresa.pe');
    await page.goto('/visitas');

    await expect(page.getByRole('heading', { name: 'Levantamiento y Visitas Técnicas' })).toBeVisible();
    await expect(page.getByText('Casa 2 pisos La Molina').first()).toBeVisible();

    // Agregar punto de levantamiento
    await page.getByRole('button', { name: /Agregar Punto/i }).click();
    await expect(page.getByRole('heading', { name: 'Agregar Punto de Levantamiento' })).toBeVisible();
    await page.locator('input[placeholder*="Fachada Principal"]').fill('Cochera Subterránea');
    await page.locator('select').first().selectOption('1'); // ASM-CAM-EXT
    await page.locator('input[type="number"]').nth(0).fill('2');
    await page.locator('input[type="number"]').nth(1).fill('45');
    await page.locator('input[placeholder*="Detalles de canaleta"]').fill('Tubería conduit IMC de 3/4"');
    await page.getByRole('button', { name: 'Agregar', exact: true }).click();

    await expect(page.getByText('Ítem de levantamiento agregado.')).toBeVisible();
    await expect(page.getByText(/Cochera Subterránea/i)).toBeVisible();

    // Adjuntar fotografía
    await page.getByRole('button', { name: '+ Adjuntar Foto' }).click();
    await expect(page.getByRole('heading', { name: 'Adjuntar Fotografía Técnica' })).toBeVisible();
    await page.locator('input[placeholder*="Ingreso vehicular"]').fill('Cochera Subterránea');
    await page.locator('input[placeholder*="Detalle del punto"]').fill('Punto de paso hacia gabinete');
    await page.getByRole('button', { name: 'Guardar Foto' }).click();
    await expect(page.getByText('Fotografía técnica registrada.')).toBeVisible();

    // Convertir visita técnica a proforma borrador
    await page.getByRole('button', { name: /Generar Proforma desde Visita/i }).click();
    await expect(page.getByText(/generada exitosamente desde la visita/i)).toBeVisible();
    await expect(page).toHaveURL(/\/proformas\/\d+$/, { timeout: 10000 });
  });

  test('OT-01, OT-02, OT-03: Órdenes de trabajo, validación de estado, registro de jornada HH y Liquidación Financiera Cotizado vs Real', async ({ page, request }) => {
    await loginAPI(request, 'gerencia@empresa.pe');

    // OT-02: Crear orden de trabajo desde una proforma en borrador devuelve 409 INVALID_STATE
    const badOt = await request.post('/api/v1/quotes/3/work-order', {
      data: { lead_technician_id: 4 },
    });
    expect(badOt.status()).toBe(409);

    // OT-01: Crear orden de trabajo desde proforma enviada (#2)
    const okOt = await request.post('/api/v1/quotes/2/work-order', {
      data: { lead_technician_id: 4, scheduled_start_date: '2026-07-01', scheduled_end_date: '2026-07-03' },
    });
    expect(okOt.status()).toBe(201);

    // UI de Órdenes de Trabajo (/ordenes)
    await loginUI(page, 'gerencia@empresa.pe');
    await page.goto('/ordenes');
    await expect(page.getByRole('heading', { name: 'Órdenes de Trabajo y Ejecución en Campo' })).toBeVisible();
    await expect(page.getByText('OT-2026-0001').first()).toBeVisible();

    // OT-03: Registrar jornada de horas reales y verificar tabla de Liquidación Financiera: Cotizado vs Real
    await page.getByRole('button', { name: /Registrar Jornada HH/i }).click();
    await expect(page.getByRole('heading', { name: 'Registrar Jornada de Trabajo' })).toBeVisible();
    await page.locator('input[type="number"]').fill('4.5');
    await page.locator('textarea').fill('Pruebas de certificación de puntos de red Cat6');
    await page.getByRole('button', { name: 'Guardar Horas' }).click();

    await expect(page.getByText('Horas y avance registrado.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Liquidación Financiera: Cotizado vs Real' })).toBeVisible();
    await expect(page.getByText('Pruebas de certificación de puntos de red Cat6')).toBeVisible();
  });

  test('Reportes Financieros y SUNAT (/reportes): Verificación de KPIs tributarios IGV y detracciones SPOT Banco de la Nación', async ({ page }) => {
    await loginUI(page, 'gerencia@empresa.pe');
    await page.goto('/reportes');

    await expect(page.getByRole('heading', { name: 'Reportes Financieros y SUNAT' })).toBeVisible();
    await expect(page.getByText('Facturación Acumulada (PEN)')).toBeVisible();
    await expect(page.getByText('Margen Comercial Promedio')).toBeVisible();
    await expect(page.getByText('IGV Débito Fiscal (18%)')).toBeVisible();
    await expect(page.getByText('SPOT Banco Nación (4%)')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Evolución de Facturación y Costos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Distribución por Especialidad' })).toBeVisible();
  });

  test('NFR-01, NFR-03, NFR-07: Health check, rendimiento de motor con 50 líneas (< 2s) y diseño Responsive móvil (375px)', async ({ page, request }) => {
    // NFR-07: Estado del sistema /health
    const healthRes = await request.get('/api/v1/health');
    expect(healthRes.status()).toBe(200);
    const health = (await healthRes.json()).data;
    expect(health.status).toBe('ok');

    // NFR-01: Rendimiento del cálculo con 50 líneas
    await loginAPI(request, 'gerencia@empresa.pe');
    const fiftyLines = Array.from({ length: 50 }, (_, i) => ({
      assembly_id: (i % 5) + 1,
      quantity: 2,
      zone_name: `Zona ${(i % 5) + 1}`,
    }));
    const t0 = Date.now();
    const calcRes = await request.post('/api/v1/quotes/preview-calculation', {
      data: { lines: fiftyLines },
    });
    const elapsedMs = Date.now() - t0;
    expect(calcRes.status()).toBe(200);
    expect(elapsedMs).toBeLessThan(2000);

    // NFR-03: Responsive en pantalla móvil de 375px de ancho
    await page.setViewportSize({ width: 375, height: 812 });
    await loginUI(page, 'vendedor@empresa.pe');
    await expect(page.getByRole('heading', { name: 'Dashboard Vendedor' })).toBeVisible();

    // Barra inferior de navegación móvil visible en 375px
    const bottomNav = page.locator('nav.fixed.bottom-0');
    await expect(bottomNav).toBeVisible();
    await bottomNav.getByRole('link', { name: /Proformas/i }).click();
    await expect(page).toHaveURL(/\/proformas/);
  });
});
