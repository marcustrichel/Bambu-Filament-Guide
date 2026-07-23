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
