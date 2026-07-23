import { test, expect } from '@playwright/test';
import { mockSupabase } from './fixtures/supabase-mock.js';

const profileA = { id: 'p-1', name: 'Overture Standard Profile', printer_model: 'A1 Mini' };
const profileB = { id: 'p-2', name: 'X1C Speed Tune', printer_model: 'X1 Carbon' };
const filamentA = { id: 'f-1', name: 'Generic Overture Filament', basic_settings: {} };
const filamentB = { id: 'f-2', name: 'Bambu PETG', basic_settings: {} };

test.beforeEach(async ({ page }) => {
  await mockSupabase(page, { profiles: [profileA, profileB], filaments: [filamentA, filamentB] });
  await page.goto('/');
});

test('searches both profiles and filaments by default', async ({ page }) => {
  await page.getByPlaceholder('Search profiles & filaments...').fill('overture');

  await expect(page.getByText('Search results for')).toBeVisible();
  await expect(page.getByText('Overture Standard Profile')).toBeVisible();
  await expect(page.getByText('Generic Overture Filament')).toBeVisible();
  await expect(page.getByText('X1C Speed Tune')).toHaveCount(0);
  await expect(page.getByText('Bambu PETG')).toHaveCount(0);
});

test('narrows the search to profiles only', async ({ page }) => {
  await page.getByRole('button', { name: 'profiles', exact: true }).click();
  await page.getByPlaceholder('Search profiles & filaments...').fill('overture');

  await expect(page.getByText('Overture Standard Profile')).toBeVisible();
  await expect(page.getByText('Generic Overture Filament')).toHaveCount(0);
});

test('clearing the search restores the normal tab view', async ({ page }) => {
  const search = page.getByPlaceholder('Search profiles & filaments...');
  await search.fill('overture');
  await expect(page.getByText('Search results for')).toBeVisible();

  await search.fill('');
  await expect(page.getByText('Search results for')).toHaveCount(0);
  await expect(page.getByText('X1C Speed Tune')).toBeVisible();
});
