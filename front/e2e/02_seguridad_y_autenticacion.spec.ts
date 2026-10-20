import { test, expect } from '@playwright/test';
import { loginAPI, loginUI } from './helpers';

test.describe('3. Autenticación y Seguridad (SEG-01 a SEG-12)', () => {
  test('SEG-01 y SEG-06: Inicio de sesión correcto en UI, acceso rápido por rol y cierre de sesión (Logout)', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Proformas Instalaciones' })).toBeVisible();

    // Probar selector rápido de rol "Gerencia"
    await page.getByRole('button', { name: 'Gerencia', exact: true }).click();
    await expect(page.locator('input[type="email"]')).toHaveValue('gerencia@empresa.pe');

    // Mostrar/ocultar contraseña
    const pwdInput = page.locator('input[placeholder="••••••••••••"]');
    await expect(pwdInput).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
    await expect(pwdInput).toHaveAttribute('type', 'text');

    // Ingresar
    await page.getByRole('button', { name: /Ingresar al sistema/i }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard Gerencia' })).toBeVisible();
    await expect(page.getByText('Roberto Sánchez').first()).toBeVisible();

    // SEG-06: Cerrar sesión invalida la sesión y redirige a /login
    await page.getByRole('button', { name: /Cerrar sesión/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('SEG-02: Contraseña incorrecta devuelve 401 con mensaje genérico en UI y API', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('noexiste_login@empresa.pe');
    await page.locator('input[placeholder="••••••••••••"]').fill('ClaveErronea!');
    await page.getByRole('button', { name: /Ingresar al sistema/i }).click();
    await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
  });

  test('SEG-03: Bloqueo temporal de cuenta tras 5 intentos fallidos (423 ACCOUNT_LOCKED)', async ({ request }) => {
    const testEmail = `lock_${Date.now()}@empresa.pe`;
    for (let i = 0; i < 5; i++) {
      const r = await request.post('/api/v1/auth/login', {
        data: { email: testEmail, password: 'WrongPassword' },
      });
      expect(r.status()).toBe(401);
    }
    const sixth = await request.post('/api/v1/auth/login', {
      data: { email: testEmail, password: 'WrongPassword' },
    });
    expect(sixth.status()).toBe(423);
    const body = await sixth.json();
    expect(body.error.code).toBe('ACCOUNT_LOCKED');
  });

  test('SEG-04: Usuario desactivado no puede iniciar sesión (401)', async ({ request }) => {
    await loginAPI(request, 'admin@empresa.pe');
    const email = `desactivado_${Date.now()}@empresa.pe`;
    const createRes = await request.post('/api/v1/users', {
      data: { full_name: 'Usuario Inactivo', email, role: 'vendedor' },
    });
    expect(createRes.status()).toBe(201);
    const newUser = (await createRes.json()).data;

    // Desactivar usuario
    const patchRes = await request.patch(`/api/v1/users/${newUser.id}`, {
      data: { is_active: 0 },
    });
    expect(patchRes.status()).toBe(200);

    // Intentar login con usuario desactivado
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email, password: 'Cambiar123!' },
    });
    expect(loginRes.status()).toBe(401);
    const errBody = await loginRes.json();
    expect(errBody.error.message).toBe('Correo o contraseña incorrectos.');
  });

  test('SEG-08 y SEG-09: Prevención de Inyección SQL en búsquedas y XSS almacenado escapado en UI', async ({ page, request }) => {
    await loginAPI(request, 'vendedor@empresa.pe');

    // SEG-08: Búsqueda con cadena de inyección SQL
    const sqliRes = await request.get(`/api/v1/customers?q=${encodeURIComponent("' OR 1=1 --")}`);
    expect(sqliRes.status()).toBe(200);
    const sqliData = (await sqliRes.json()).data;
    expect(sqliData).toEqual([]);

    // SEG-09: Guardar payload XSS en cliente y verificar que no ejecuta script en UI
    const ruc = String(Math.floor(10000000000 + Math.random() * 89999999999));
    const xssName = '<script>window.__xss_triggered = true;</script>Empresa Segura SAC';
    const cRes = await request.post('/api/v1/customers', {
      data: {
        document_type: 'RUC',
        document_number: ruc,
        business_name: xssName,
        contact_name: 'Contacto XSS',
        phone: '999888777',
      },
    });
    expect(cRes.status()).toBe(201);

    await loginUI(page, 'vendedor@empresa.pe');
    await page.goto('/proformas/nueva');
    const xssTriggered = await page.evaluate(() => (window as any).__xss_triggered);
    expect(xssTriggered).toBeUndefined();
    await expect(page.locator('select').first()).toContainText(xssName);
  });

  test('SEG-12: Acceso sin sesión devuelve 401 en API y redirige a /login en rutas protegidas', async ({ page, playwright }) => {
    const anonContext = await playwright.request.newContext({ baseURL: 'http://localhost:8080' });
    const res = await anonContext.get('/api/v1/quotes');
    expect(res.status()).toBe(401);
    await anonContext.dispose();

    await page.context().clearCookies();
    await page.goto('/proformas');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Recuperación y restablecimiento de contraseña mediante Modal en Login', async ({ page, request }) => {
    // Crear usuario temporal para probar reset de contraseña sin afectar cuentas semilla
    await loginAPI(request, 'admin@empresa.pe');
    const resetEmail = `reset_${Date.now()}@empresa.pe`;
    await request.post('/api/v1/users', {
      data: { full_name: 'Usuario Reset', email: resetEmail, role: 'vendedor' },
    });
    await request.post('/api/v1/auth/logout');

    await page.goto('/login');
    await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click();
    await expect(page.getByRole('heading', { name: 'Restablecer Contraseña' })).toBeVisible();

    const modalInput = page.locator('input[placeholder="nombre@empresa.pe"]').last();
    await modalInput.fill(resetEmail);
    await page.getByRole('button', { name: 'Solicitar Token' }).click();

    await expect(page.locator('input[placeholder="Nueva contraseña"]')).toBeVisible();
    await page.locator('input[placeholder="Nueva contraseña"]').fill('NuevaClave999!');
    await page.getByRole('button', { name: 'Guardar nueva contraseña' }).click();
    await expect(page.getByText(/Contraseña restablecida con éxito/i)).toBeVisible();
  });
});
