import { Page, APIRequestContext, expect } from '@playwright/test';

export async function loginUI(page: Page, email: string, password = 'Secret123!') {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[placeholder="••••••••••••"]').fill(password);
  await page.getByRole('button', { name: /Ingresar al sistema/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function loginAPI(request: APIRequestContext, email: string, password = 'Secret123!') {
  const res = await request.post('/api/v1/auth/login', {
    data: { email, password },
  });
  expect(res.status()).toBe(200);
  return res.json();
}

export const REFERENCE_LINES = [
  { assembly_id: 1, quantity: 4, zone_name: 'Zona 1' }, // 4 x ASM-CAM-EXT
  { assembly_id: 2, quantity: 2, zone_name: 'Zona 1' }, // 2 x ASM-AP
  { assembly_id: 3, quantity: 1, zone_name: 'Zona 1' }, // 1 x ASM-NVR
  { assembly_id: 4, quantity: 1, zone_name: 'Zona 1' }, // 1 x ASM-SW8
  { assembly_id: 5, quantity: 1, zone_name: 'Zona 1' }, // 1 x ASM-VP-CASA
];
