import { test, expect } from '@playwright/test';
import { loginAPI, loginUI } from './helpers';

test.describe('5. Clientes, Catálogo, Tipo de Cambio, Parámetros y Auditoría (DAT & AUD)', () => {
  test('DAT-01, DAT-03, DAT-04: Crear cliente con RUC válido, consulta SUNAT, rechazo de RUC duplicado (409) y creación de proyecto', async ({ request }) => {
    await loginAPI(request, 'vendedor@empresa.pe');
    const ruc = '20554433221';

    // Consulta SUNAT/RENIEC
    const lookupRes = await request.get(`/api/v1/customers/lookup?document=${ruc}`);
    expect(lookupRes.status()).toBe(200);
    const lookup = (await lookupRes.json()).data;
    expect(lookup.business_name).toContain(ruc);

    // DAT-01: Crear cliente con RUC válido
    const c1 = await request.post('/api/v1/customers', {
      data: {
        document_type: 'RUC',
        document_number: ruc,
        business_name: 'Corporación Peruana de Redes S.A.C.',
        contact_name: 'Elena Gómez',
        phone: '991234567',
        email: 'egomez@corpredes.pe',
      },
    });
    expect(c1.status()).toBe(201);
    const createdCustomer = (await c1.json()).data;

    // DAT-03: RUC duplicado devuelve 409 DUPLICATE_CUSTOMER
    const cDup = await request.post('/api/v1/customers', {
      data: {
        document_type: 'RUC',
        document_number: ruc,
        business_name: 'Otra Empresa Duplicada',
      },
    });
    expect(cDup.status()).toBe(409);
    const dupErr = await cDup.json();
    expect(dupErr.error.code).toBe('DUPLICATE_CUSTOMER');

    // DAT-04: Crear proyecto asociado al cliente
    const pRes = await request.post('/api/v1/projects', {
      data: {
        customer_id: createdCustomer.id,
        name: 'Planta Industrial Lurín',
        property_type: 'planta_industrial',
        floors: 2,
        installation_address: 'Km 32 Panamericana Sur, Lurín',
      },
    });
    expect(pRes.status()).toBe(201);
  });

  test('Catálogo UI (/catalogo): Búsqueda, Ficha Técnica Homologada, pestañas de Ensamblajes/Proveedores y Clonación de Kit', async ({ page }) => {
    await loginUI(page, 'admin@empresa.pe');
    await page.goto('/catalogo');

    await expect(page.getByRole('heading', { name: 'Catálogo Técnico y Detalle de Equipos' })).toBeVisible();
    await expect(page.getByText('Ficha Técnica Homologada')).toBeVisible();
    await expect(page.getByText('Cámara Bullet IP 4MP').first()).toBeVisible();

    // Búsqueda por SKU
    const searchInput = page.locator('input[placeholder*="Buscar por código, SKU"]');
    await searchInput.fill('NVR-8CH');
    await expect(page.getByText('NVR 8 canales').first()).toBeVisible();
    await searchInput.fill('');

    // Pestaña Kits y Ensamblajes + Clonar Kit
    await page.getByRole('button', { name: 'Kits y Ensamblajes' }).click();
    await expect(page.getByText('ASM-CAM-EXT').first()).toBeVisible();
    await page.getByRole('button', { name: 'Clonar Kit' }).first().click();
    await expect(page.getByText('Ensamblaje clonado con éxito.')).toBeVisible();
    await expect(page.getByText('ASM-CAM-EXT-CLON')).toBeVisible();

    // Pestaña Proveedores
    await page.getByRole('button', { name: 'Proveedores' }).click();
    await expect(page.getByRole('heading', { name: 'TecnoSeg SAC' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'RedPro Perú' })).toBeVisible();
  });

  test('DAT-11 y DAT-12: Importación masiva de catálogo CSV con validación de filas válidas y rechazadas en UI y API', async ({ page, request }) => {
    await loginAPI(request, 'admin@empresa.pe');

    // Archivo vacío devuelve 422
    const emptyRes = await request.post('/api/v1/catalog/import', {
      data: { content: '   ', mode: 'validate' },
    });
    expect(emptyRes.status()).toBe(422);

    // Importación mixta: 2 filas válidas y 1 fila con error (costo negativo y sin nombre)
    const csvMixto = [
      'sku,name,category,unit_cost,currency,unit',
      'IMP-CAM-01,Cámara PTZ 25X Exterior,cctv,180.00,USD,UND',
      'IMP-SW-16,Switch Administrable 16P,redes,450.00,PEN,UND',
      'IMP-ERR-99,,cctv,-15,EUR,UND',
    ].join('\n');

    await loginUI(page, 'admin@empresa.pe');
    await page.goto('/catalogo');
    await page.getByRole('button', { name: /Importar CSV/i }).click();
    await expect(page.getByRole('heading', { name: /Importar Catálogo por CSV/i })).toBeVisible();

    const textarea = page.locator('textarea');
    await textarea.fill(csvMixto);

    // Validar sin guardar
    await page.getByRole('button', { name: 'Validar Sin Guardar' }).click();
    await expect(page.getByText(/Filas analizadas: 3 \| Válidas: 2 \| Rechazadas: 3/i)).toBeVisible();

    // Procesar e Importar
    await page.getByRole('button', { name: 'Procesar e Importar' }).click();
    await expect(page.getByText(/Se importaron 2 productos exitosamente/i)).toBeVisible();
  });

  test('Parámetros (/parametros) y Administración (/admin): Guardar parámetros, tipo de cambio, crear usuario y auditar bitácora (AUD-01..AUD-04)', async ({ page }) => {
    await loginUI(page, 'admin@empresa.pe');

    // Parámetros
    await page.goto('/parametros');
    await expect(page.getByRole('heading', { name: 'Parámetros', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Parámetros guardados')).toBeVisible();

    await page.getByRole('button', { name: 'Actualizar' }).click();
    await expect(page.getByText('Tipo de cambio actualizado')).toBeVisible();

    // Administración y Bitácora de auditoría
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Administración' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bitácora de auditoría' })).toBeVisible();

    const uniqueEmail = `auditor_${Date.now()}@empresa.pe`;
    await page.locator('input[placeholder="Nombre"]').fill('Inspector QA');
    await page.locator('input[placeholder="Correo"]').fill(uniqueEmail);
    await page.getByRole('button', { name: 'Crear' }).click();

    await expect(page.getByText('Inspector QA')).toBeVisible();
    await expect(page.getByText(uniqueEmail)).toBeVisible();
    // Verificar que la bitácora registró las acciones recientes
    await expect(page.getByText('labor_params #1').first()).toBeVisible();
    await expect(page.getByText('exchange_rate #1').first()).toBeVisible();
  });
});
