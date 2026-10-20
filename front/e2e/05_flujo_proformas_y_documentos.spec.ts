import { test, expect } from '@playwright/test';
import { loginAPI, loginUI, REFERENCE_LINES } from './helpers';

test.describe('6 & 7. Flujo Completo de Proformas, Aprobaciones y Documentos (PRO-01 a PRO-24 y DOC-01 a DOC-08)', () => {
  test('Wizard E2E (4 pasos): Crear proforma de referencia en UI, emitir, marcar enviada y registrar aceptación del cliente', async ({ page }) => {
    await loginUI(page, 'vendedor@empresa.pe');
    await page.goto('/proformas/nueva');

    // Paso 1: Cliente y proyecto
    await expect(page.getByText('Paso 1 de 4 — Cliente y proyecto')).toBeVisible();
    await page.locator('select').first().selectOption({ index: 1 }); // Inversiones Andina S.A.C.
    const inputsStep1 = page.locator('.neu input');
    await inputsStep1.nth(0).fill('Oficinas Corporativas San Isidro');
    await inputsStep1.nth(2).fill('Av. Rivera Navarrete 750, San Isidro');
    await page.getByRole('button', { name: 'Siguiente' }).click();

    // Paso 2: Zonas y equipos
    await expect(page.getByText('Paso 2 de 4 — Zonas y equipos')).toBeVisible();
    await page.getByRole('button', { name: '+ Zona' }).click();
    // Agregar ensamblaje ASM-CAM-EXT
    const asmSelect = page.locator('select').nth(2);
    await asmSelect.selectOption('1');
    await expect(page.locator('.neu-in', { hasText: 'ASM-CAM-EXT' })).toBeVisible();
    await page.getByRole('button', { name: 'Siguiente' }).click();

    // Paso 3: Mano de obra, cuadrillas y descuento autónomo 5%
    await expect(page.getByText('Paso 3 de 4 — Mano de obra')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Comparador de cuadrillas' })).toBeVisible();
    const discountInput = page.locator('input[type="number"]').nth(2);
    await discountInput.fill('5');
    // Marcar servicio de mantenimiento recurrente
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: 'Siguiente' }).click();

    // Paso 4: Resumen y condiciones comerciales editables (PRO-23)
    await expect(page.getByText('Paso 4 de 4 — Resumen')).toBeVisible();
    const textareas = page.locator('textarea');
    await textareas.nth(1).fill('No incluye canalización subterránea ni trámites municipales.');
    await expect(page.locator('.neu-in', { hasText: 'Vista previa:' })).toContainText('Oficinas Corporativas San Isidro');

    await page.getByRole('button', { name: 'Guardar y revisar' }).click();

    // En vista de detalle (/proformas/:id): estado inicial borrador
    await expect(page).toHaveURL(/\/proformas\/\d+$/);
    await expect(page.locator('.badge', { hasText: 'borrador' })).toBeVisible();

    // PRO-05: Descuento 5% dentro del tope se emite sin aprobación
    await page.getByRole('button', { name: 'Emitir proforma' }).click();
    await expect(page.locator('.badge', { hasText: 'emitida' })).toBeVisible();

    // Marcar enviada
    await page.getByRole('button', { name: 'Marcar enviada' }).click();
    await expect(page.locator('.badge', { hasText: 'enviada' })).toBeVisible();

    // Registrar aceptación del cliente
    await page.getByRole('button', { name: 'Cliente aceptó' }).click();
    await expect(page.locator('.badge', { hasText: 'aceptada' })).toBeVisible();
  });

  test('PRO-06, PRO-07, PRO-08, PRO-13, PRO-16, PRO-17, PRO-22: Flujo de descuento > 5%, bloqueo, aprobación de Gerencia, inmutabilidad y versionado', async ({ request }) => {
    // 1. Vendedor crea proforma con descuento 10% (sobre el tope de 5%)
    await loginAPI(request, 'vendedor@empresa.pe');
    const createRes = await request.post('/api/v1/quotes', {
      data: {
        customer_id: 1,
        project_id: 1,
        lines: REFERENCE_LINES,
        discount_pct: 10,
      },
    });
    expect(createRes.status()).toBe(201);
    const quote = (await createRes.json()).data;
    expect(quote.requires_approval).toBe(true);
    expect(quote.status).toBe('borrador');

    // PRO-06: Intentar emitir sin aprobación bloquea con 403 APPROVAL_REQUIRED
    const issueBlocked = await request.post(`/api/v1/quotes/${quote.id}/issue`);
    expect(issueBlocked.status()).toBe(403);
    expect((await issueBlocked.json()).error.code).toBe('APPROVAL_REQUIRED');

    // PRO-07: Vendedor solicita aprobación -> pasa a en_aprobacion
    const reqApp = await request.post(`/api/v1/quotes/${quote.id}/request-approval`);
    expect(reqApp.status()).toBe(200);
    expect((await reqApp.json()).data.status).toBe('en_aprobacion');

    // Gerencia aprueba la proforma
    await loginAPI(request, 'gerencia@empresa.pe');
    const approveRes = await request.post(`/api/v1/quotes/${quote.id}/approve`, {
      data: { comment: 'Descuento corporativo autorizado por Gerencia' },
    });
    expect(approveRes.status()).toBe(200);
    const approvedQuote = (await approveRes.json()).data;
    expect(approvedQuote.approved).toBe(true);

    // Ahora el Vendedor emite la proforma aprobada
    await loginAPI(request, 'vendedor@empresa.pe');
    const issueOk = await request.post(`/api/v1/quotes/${quote.id}/issue`);
    expect(issueOk.status()).toBe(200);
    expect((await issueOk.json()).data.status).toBe('emitida');

    // PRO-13: Proforma emitida es inmutable (PUT devuelve 409 QUOTE_IMMUTABLE)
    const mutateRes = await request.put(`/api/v1/quotes/${quote.id}`, {
      data: { discount_pct: 0 },
    });
    expect(mutateRes.status()).toBe(409);
    expect((await mutateRes.json()).error.code).toBe('QUOTE_IMMUTABLE');

    // PRO-16: Emitir dos veces devuelve 409
    const issueTwice = await request.post(`/api/v1/quotes/${quote.id}/issue`);
    expect(issueTwice.status()).toBe(409);

    // PRO-17: Crear nueva versión (v2 en borrador con parent_quote_id)
    const newVerRes = await request.post(`/api/v1/quotes/${quote.id}/new-version`);
    expect(newVerRes.status()).toBe(201);
    const v2 = (await newVerRes.json()).data;
    expect(v2.version).toBe(2);
    expect(v2.status).toBe('borrador');
    expect(v2.parent_quote_id).toBe(quote.id);

    // PRO-22: Duplicar proforma genera nuevo código correlativo con versión 1 en borrador
    const dupRes = await request.post(`/api/v1/quotes/${quote.id}/duplicate`);
    expect(dupRes.status()).toBe(201);
    const duplicated = (await dupRes.json()).data;
    expect(duplicated.version).toBe(1);
    expect(duplicated.status).toBe('borrador');
    expect(duplicated.code).not.toBe(quote.code);
  });

  test('DOC-01, DOC-02, DOC-03, DOC-06, DOC-08: Generación de documento PDF/HTML sin costos internos y coherencia de totales con caracteres especiales', async ({ request }) => {
    await loginAPI(request, 'vendedor@empresa.pe');

    // DOC-08: Crear cliente con caracteres especiales (Peña & Muñoz S.A.C.) y proforma CAL-01
    const cRes = await request.post('/api/v1/customers', {
      data: {
        document_type: 'RUC',
        document_number: String(Math.floor(20100000000 + Math.random() * 900000000)),
        business_name: 'Peña & Muñoz Ingeniería S.A.C.',
      },
    });
    const customer = (await cRes.json()).data;

    const qRes = await request.post('/api/v1/quotes', {
      data: {
        customer_id: customer.id,
        project_id: 1,
        lines: REFERENCE_LINES,
        discount_pct: 0,
      },
    });
    const q = (await qRes.json()).data;

    // Descargar documento PDF/HTML
    const pdfRes = await request.get(`/api/v1/quotes/${q.id}/pdf`);
    expect(pdfRes.status()).toBe(200);
    const html = await pdfRes.text();

    // DOC-01, DOC-03, DOC-08: Contiene código, cliente con eñe y ampersand, y totales exactos de CAL-01
    expect(html).toContain(q.code);
    expect(html).toContain('Peña & Muñoz Ingeniería S.A.C.');
    expect(html).toContain('Base: S/ 5926.11');
    expect(html).toContain('IGV: S/ 1066.70');
    expect(html).toContain('Total: S/ 6992.81');

    // DOC-02: No expone costos internos ni margen en el documento del cliente
    expect(html).not.toContain('4148.28');
    expect(html).not.toContain('3126.00');
    expect(html).not.toContain('Margen');
  });

  test('Lista de Proformas (/proformas): Búsqueda por texto y filtrado por estado en UI', async ({ page }) => {
    await loginUI(page, 'gerencia@empresa.pe');
    await page.goto('/proformas');

    await expect(page.getByRole('heading', { name: 'Proformas' })).toBeVisible();
    const searchInput = page.locator('input[placeholder*="Buscar por código o cliente"]');
    await searchInput.fill('PF-2026-0001');
    await expect(page.getByRole('link', { name: /PF-2026-0001/i })).toBeVisible();

    await searchInput.fill('');
    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('en_aprobacion');
    await expect(page.locator('tbody tr').first()).toContainText('en_aprobacion');
  });
});
