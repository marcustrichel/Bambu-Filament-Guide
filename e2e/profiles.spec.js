import { test, expect } from '@playwright/test';
import { mockSupabase, signIn } from './fixtures/supabase-mock.js';

const communityProfile = {
  id: 'profile-1',
  user_id: 'someone-else',
  name: 'Community 0.20mm',
  printer_model: 'A1 Mini',
  quality: { layer_height: 0.2 },
  strength: {},
  speed: { acceleration: 5000 },
  support: {},
  others: {},
};

test('browses community print profiles while signed out', async ({ page }) => {
  await mockSupabase(page, { profiles: [communityProfile] });
  await page.goto('/');

  await expect(page.getByText('Community 0.20mm')).toBeVisible();
  await expect(page.getByRole('button', { name: 'New Profile' })).toHaveCount(0);
});

test('opens a community profile in read-only mode', async ({ page }) => {
  await mockSupabase(page, { profiles: [communityProfile] });
  await page.goto('/');

  await page.getByText('Community 0.20mm').click();
  await expect(page.getByText('Read Only')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Changes' })).toHaveCount(0);
});

test('signs in and creates a new print profile', async ({ page }) => {
  const state = await mockSupabase(page, { profiles: [] });
  await page.goto('/');
  await signIn(page);

  await page.getByRole('button', { name: 'New Profile' }).click();
  await page.getByPlaceholder('Enter Name...').fill('My New Profile');

  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/rest/v1/print_profiles') && req.method() === 'POST'),
    page.getByRole('button', { name: 'Save Changes' }).click(),
  ]);
  const body = request.postDataJSON();
  expect(body.name).toBe('My New Profile');
  expect(body.user_id).toBe('e2e-user-1');

  await expect(page.getByRole('heading', { name: 'My New Profile' }).or(page.getByText('My New Profile'))).toBeVisible();
});

test('changing the target printer updates the speed defaults', async ({ page }) => {
  await mockSupabase(page, {
    profiles: [],
    printerModels: [{ id: 'model-a', name: 'A1 Mini' }, { id: 'model-b', name: 'X1 Carbon' }],
  });
  await page.goto('/');
  await signIn(page);

  await page.getByRole('button', { name: 'New Profile' }).click();
  await page.getByRole('combobox', { name: 'Target Printer' }).selectOption('X1 Carbon');
  await page.getByRole('button', { name: 'Speed' }).click();

  await expect(page.getByText('Normal printing', { exact: true }).locator('..').getByRole('spinbutton')).toHaveValue('10000');
});

test('edits fields across the expanded Quality/Strength/Support/Others tabs and saves them', async ({ page }) => {
  await mockSupabase(page, { profiles: [] });
  await page.goto('/');
  await signIn(page);

  await page.getByRole('button', { name: 'New Profile' }).click();

  // Quality tab is shown by default.
  await expect(page.getByText('Precision', { exact: true })).toBeVisible();
  await page.getByText('Elephant foot compensation').locator('..').getByRole('spinbutton').fill('0.15');

  await page.getByRole('button', { name: 'Strength' }).click();
  await page.getByText('Wall loops').locator('..').getByRole('spinbutton').fill('3');

  await page.getByRole('button', { name: 'Support' }).click();
  await page.getByText('Independent support layer height').locator('..').locator('input[type="checkbox"]').uncheck();

  await page.getByRole('button', { name: 'Others' }).click();
  await page.getByText('Post-processing scripts').locator('..').getByRole('textbox').fill('/scripts/notify.sh');

  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/rest/v1/print_profiles') && req.method() === 'POST'),
    page.getByRole('button', { name: 'Save Changes' }).click(),
  ]);
  const body = request.postDataJSON();
  expect(body.quality.elephant_foot_compensation).toBe(0.15);
  expect(body.strength.wall_loops).toBe(3);
  expect(body.support.support_independent_layer_height).toBe(false);
  expect(body.others.post_processing_scripts).toBe('/scripts/notify.sh');
});

test('clones a community profile from the Clone button inside the editor', async ({ page }) => {
  await mockSupabase(page, { profiles: [communityProfile] });
  await page.goto('/');
  await signIn(page);

  await page.getByText('Community 0.20mm').click();
  await expect(page.getByRole('button', { name: 'Clone' })).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/rest/v1/print_profiles') && req.method() === 'POST'),
    page.getByRole('button', { name: 'Clone' }).click(),
  ]);
  const body = request.postDataJSON();
  expect(body.name).toBe('Community 0.20mm (Copy)');
  expect(body.user_id).toBe('e2e-user-1');
  expect(body).not.toHaveProperty('id');
});
