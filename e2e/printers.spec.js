import { test, expect } from '@playwright/test';
import { mockSupabase, signIn } from './fixtures/supabase-mock.js';

const profileA = { id: 'profile-a', user_id: 'e2e-user-1', name: 'Profile A', printer_model: 'A1 Mini' };
const profileB = { id: 'profile-b', user_id: 'e2e-user-1', name: 'Profile B', printer_model: 'A1 Mini' };

test('signed-out users see a placeholder instead of printers', async ({ page }) => {
  await mockSupabase(page, {});
  await page.goto('/');
  await page.getByRole('button', { name: 'Printers' }).click();
  await expect(page.getByText('Sign in to manage your printers.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'New Printer' })).toHaveCount(0);
});

test('creates a new printer', async ({ page }) => {
  await mockSupabase(page, { profiles: [profileA] });
  await page.goto('/');
  await signIn(page);

  await page.getByRole('button', { name: 'Printers' }).click();
  await page.getByRole('button', { name: 'New Printer' }).click();
  await page.locator('#printer-name').fill('My A1 Mini');

  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/rest/v1/printers') && req.method() === 'POST'),
    page.getByRole('button', { name: 'Save Changes' }).click(),
  ]);
  const body = request.postDataJSON();
  expect(body.name).toBe('My A1 Mini');
  expect(body.user_id).toBe('e2e-user-1');

  await expect(page.getByRole('cell', { name: 'My A1 Mini' })).toBeVisible();
});

test('sets a printer\'s default print profile', async ({ page }) => {
  const printer = {
    id: 'printer-1', user_id: 'e2e-user-1', name: 'My A1 Mini', model: 'A1 Mini',
    nozzle_diameter: 0.4, bed_size_x: 180, bed_size_y: 180, default_print_profile_id: null,
  };
  await mockSupabase(page, { printers: [printer], profiles: [profileA, profileB] });
  await page.goto('/');
  await signIn(page);

  await page.getByRole('button', { name: 'Printers' }).click();
  await expect(page.getByRole('cell', { name: '—' })).toBeVisible(); // no default profile yet

  await page.getByRole('row', { name: /My A1 Mini/ }).click();
  await page.locator('#printer-default-profile').selectOption('profile-b');

  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/rest/v1/printers') && req.method() === 'PATCH'),
    page.getByRole('button', { name: 'Save Changes' }).click(),
  ]);
  const body = request.postDataJSON();
  expect(body.default_print_profile_id).toBe('profile-b');

  await expect(page.getByRole('cell', { name: 'Profile B' })).toBeVisible();
});
