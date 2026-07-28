import { test, expect } from '@playwright/test';
import { mockSupabase, signIn } from './fixtures/supabase-mock.js';

const profileA = { id: 'profile-a', name: 'Profile A', printer_model: 'A1 Mini' };
const communityFilament = {
  id: 'filament-1',
  user_id: 'someone-else',
  name: 'Community PLA',
  print_profile_id: 'profile-a',
  basic_settings: { vendor: 'Overture', color: '#000000' },
  temp_settings: { first_layer_nozzle: 220 },
  cooling_settings: { max_fan_speed: 100 },
  override_settings: {},
  scarf_seam: {},
  notes: '',
};

test('browses filaments while signed out and opens one read-only', async ({ page }) => {
  await mockSupabase(page, { filaments: [communityFilament] });
  await page.goto('/');
  await page.getByRole('button', { name: '🧶 Filaments' }).click();

  await expect(page.getByText('Community PLA')).toBeVisible();
  await page.getByText('Community PLA').click();
  await expect(page.getByRole('button', { name: 'Save Changes' })).toHaveCount(0);
});

test('signs in and creates a new filament, defaulting to the first available profile', async ({ page }) => {
  await mockSupabase(page, { profiles: [profileA], filaments: [] });
  await page.goto('/');
  await signIn(page);

  await page.getByRole('button', { name: '🧶 Filaments' }).click();
  await page.getByRole('button', { name: 'New Filament' }).click();

  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/rest/v1/filaments') && req.method() === 'POST'),
    page.getByRole('button', { name: 'Save Changes' }).click(),
  ]);
  const body = request.postDataJSON();
  expect(body.print_profile_id).toBe('profile-a');
  expect(body.user_id).toBe('e2e-user-1');
});

test('blocks saving a filament with no linked print profile', async ({ page }) => {
  await mockSupabase(page, { profiles: [], filaments: [] });
  await page.goto('/');
  await signIn(page);

  await page.getByRole('button', { name: '🧶 Filaments' }).click();
  await page.getByRole('button', { name: 'New Filament' }).click();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Save Changes' }).click();
  // No profile exists to select, so save should be rejected client-side —
  // the modal stays open rather than a POST going out.
  await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
});

test('sets Metal stickiness on a new filament and saves it', async ({ page }) => {
  await mockSupabase(page, { profiles: [profileA], filaments: [] });
  await page.goto('/');
  await signIn(page);

  await page.getByRole('button', { name: '🧶 Filaments' }).click();
  await page.getByRole('button', { name: 'New Filament' }).click();

  await page.getByText('Metal stickiness').locator('..').getByRole('combobox').selectOption('High');

  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/rest/v1/filaments') && req.method() === 'POST'),
    page.getByRole('button', { name: 'Save Changes' }).click(),
  ]);
  const body = request.postDataJSON();
  expect(body.basic_settings.metal_stickiness).toBe('High');
});

test('edits Cooling tab fields on a new filament and saves them', async ({ page }) => {
  await mockSupabase(page, { profiles: [profileA], filaments: [] });
  await page.goto('/');
  await signIn(page);

  await page.getByRole('button', { name: '🧶 Filaments' }).click();
  await page.getByRole('button', { name: 'New Filament' }).click();

  await page.getByText('Cooling', { exact: true }).click();
  await expect(page.getByText('Auxiliary Part Cooling Fan')).toBeVisible();

  await page.getByText('Cooling overhang threshold').locator('..').locator('input[type="number"]').fill('75');
  await page.getByText("Don't slow down outer walls").locator('..').locator('input[type="checkbox"]').check();

  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/rest/v1/filaments') && req.method() === 'POST'),
    page.getByRole('button', { name: 'Save Changes' }).click(),
  ]);
  const body = request.postDataJSON();
  expect(body.cooling_settings.overhang_cooling_threshold).toBe(75);
  expect(body.cooling_settings.dont_slow_down_outer_walls).toBe(true);
});

test('edits Setting Overrides tab fields on a new filament and saves them', async ({ page }) => {
  await mockSupabase(page, { profiles: [profileA], filaments: [] });
  await page.goto('/');
  await signIn(page);

  await page.getByRole('button', { name: '🧶 Filaments' }).click();
  await page.getByRole('button', { name: 'New Filament' }).click();

  await page.getByText('Setting Overrides', { exact: true }).click();
  await expect(page.getByText('Override overhang speed')).toBeVisible();

  await page.getByText('Z Hop Type').locator('..').getByRole('combobox').selectOption('Spiral Lift');
  await page.getByText('Retraction distance when cut').locator('..').locator('input[type="number"]').fill('20');
  await page.getByText('Override overhang speed').locator('..').locator('input[type="checkbox"]').check();

  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/rest/v1/filaments') && req.method() === 'POST'),
    page.getByRole('button', { name: 'Save Changes' }).click(),
  ]);
  const body = request.postDataJSON();
  expect(body.override_settings.z_hop_type).toBe('Spiral Lift');
  expect(body.override_settings.retraction_distance_when_cut).toBe(20);
  expect(body.override_settings.override_overhang_speed).toBe(true);
});

test('clones a community filament from the Clone button inside the editor', async ({ page }) => {
  await mockSupabase(page, { profiles: [profileA], filaments: [communityFilament] });
  await page.goto('/');
  await signIn(page);

  await page.getByRole('button', { name: '🧶 Filaments' }).click();
  await page.getByText('Community PLA').click();
  await expect(page.getByRole('button', { name: 'Clone' })).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/rest/v1/filaments') && req.method() === 'POST'),
    page.getByRole('button', { name: 'Clone' }).click(),
  ]);
  const body = request.postDataJSON();
  expect(body.name).toBe('Community PLA (Copy)');
  expect(body.user_id).toBe('e2e-user-1');
});
