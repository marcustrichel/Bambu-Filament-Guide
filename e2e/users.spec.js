import { test, expect } from '@playwright/test';
import { mockSupabase, signIn, mockAuthUser } from './fixtures/supabase-mock.js';

const adminSelf = { id: mockAuthUser.id, email: mockAuthUser.email, role: 'admin', disabled: false, full_name: null, phone: null };
const standardTarget = { id: 'target-1', email: 'standard@example.com', role: 'standard', disabled: false, full_name: 'Standard User', phone: null };

test('standard users do not see the Users nav item', async ({ page }) => {
  const selfStandard = { ...adminSelf, role: 'standard' };
  await mockSupabase(page, { userProfiles: [selfStandard] });
  await page.goto('/');
  await signIn(page);

  await expect(page.getByRole('button', { name: 'Users' })).toHaveCount(0);
});

test('admin sees the Users nav, lists users, and can edit one', async ({ page }) => {
  await mockSupabase(page, { userProfiles: [adminSelf, standardTarget] });
  await page.goto('/');
  await signIn(page);

  await page.getByRole('button', { name: 'Users' }).click();
  await expect(page.getByText('standard@example.com')).toBeVisible();

  await page.getByRole('row', { name: /standard@example.com/ }).getByRole('button', { name: 'Edit' }).click();
  await page.locator('#user-full-name').fill('Updated Name');

  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/rest/v1/user_profiles') && req.method() === 'PATCH'),
    page.getByRole('button', { name: 'Save Changes' }).click(),
  ]);
  const body = request.postDataJSON();
  expect(body.full_name).toBe('Updated Name');
});

test('admin changes a user\'s email via the Edge Function', async ({ page }) => {
  await mockSupabase(page, { userProfiles: [adminSelf, standardTarget] });
  await page.goto('/');
  await signIn(page);

  await page.getByRole('button', { name: 'Users' }).click();
  await page.getByRole('row', { name: /standard@example.com/ }).getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('button', { name: 'Change Email' }).click();
  await page.locator('input[type="email"]').fill('new-standard@example.com');

  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/functions/v1/update-user-email')),
    page.getByRole('button', { name: 'Update' }).click(),
  ]);
  expect(request.postDataJSON()).toEqual({ targetUserId: 'target-1', newEmail: 'new-standard@example.com' });
});

test('elevated users cannot change a user\'s role', async ({ page }) => {
  const elevatedSelf = { ...adminSelf, role: 'elevated' };
  await mockSupabase(page, { userProfiles: [elevatedSelf, standardTarget] });
  await page.goto('/');
  await signIn(page);

  await page.getByRole('button', { name: 'Users' }).click();
  await page.getByRole('row', { name: /standard@example.com/ }).getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('#user-role')).toBeDisabled();
});
