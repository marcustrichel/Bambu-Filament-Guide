import { test, expect } from '@playwright/test';
import { mockSupabase, signIn } from './fixtures/supabase-mock.js';

test('signed-out users can see the printer models list but not manage it', async ({ page }) => {
  await mockSupabase(page, { printerModels: [{ id: 'model-a', name: 'A1 Mini' }] });
  await page.goto('/');
  await page.getByRole('button', { name: 'Printer Models' }).click();

  await expect(page.getByText('A1 Mini')).toBeVisible();
  await expect(page.getByPlaceholder('e.g. H2D')).toHaveCount(0);
});

test('adds a new printer model', async ({ page }) => {
  await mockSupabase(page, { printerModels: [] });
  await page.goto('/');
  await signIn(page);

  await page.getByRole('button', { name: 'Printer Models' }).click();
  await page.getByPlaceholder('e.g. H2D').fill('H2D');

  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/rest/v1/printer_models') && req.method() === 'POST'),
    page.getByRole('button', { name: 'Add' }).click(),
  ]);
  expect(request.postDataJSON()).toEqual({ name: 'H2D' });
  await expect(page.getByText('H2D')).toBeVisible();
});

test('shows a warning icon instead of a delete button for a model still in use', async ({ page }) => {
  await mockSupabase(page, {
    printerModels: [{ id: 'model-a', name: 'A1 Mini' }, { id: 'model-b', name: 'P1S' }],
    printerModelUsage: [{ name: 'A1 Mini', in_use: true }, { name: 'P1S', in_use: false }],
  });
  await page.goto('/');
  await signIn(page);
  await page.getByRole('button', { name: 'Printer Models' }).click();

  const inUseRow = page.getByRole('listitem').filter({ hasText: 'A1 Mini' });
  const unusedRow = page.getByRole('listitem').filter({ hasText: 'P1S' });
  await expect(inUseRow.getByTitle(/In use/)).toBeVisible();
  await expect(inUseRow.getByRole('button')).toHaveCount(0);
  await expect(unusedRow.getByRole('button')).toBeVisible();
});

test('deletes a printer model that is not in use', async ({ page }) => {
  await mockSupabase(page, {
    printerModels: [{ id: 'model-b', name: 'P1S' }],
    printerModelUsage: [{ name: 'P1S', in_use: false }],
  });
  await page.goto('/');
  await signIn(page);
  await page.getByRole('button', { name: 'Printer Models' }).click();

  page.once('dialog', (dialog) => dialog.accept());
  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/rest/v1/printer_models') && req.method() === 'DELETE'),
    page.getByRole('listitem').filter({ hasText: 'P1S' }).getByRole('button').click(),
  ]);
  expect(request.url()).toContain('id=eq.model-b');
  await expect(page.getByText('P1S')).toHaveCount(0);
});
