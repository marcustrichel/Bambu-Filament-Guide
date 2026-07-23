import { test, expect } from '@playwright/test';
import { mockSupabase } from './fixtures/supabase-mock.js';

test('requests a password reset email', async ({ page }) => {
  await mockSupabase(page, {});
  await page.goto('/');

  await page.getByRole('button', { name: 'Sign In / Up' }).click();
  await page.getByText('Forgot password?').click();
  await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();

  await page.getByLabel('Email').fill('e2e@example.com');

  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes('/auth/v1/recover')),
    page.getByRole('button', { name: 'Send Reset Link' }).click(),
  ]);
  const body = request.postDataJSON();
  expect(body.email).toBe('e2e@example.com');

  // Modal closes and the app confirms the email was sent
  await expect(page.getByRole('heading', { name: 'Reset Password' })).toHaveCount(0);
});

test('"Back to Sign In" returns to the sign-in form without submitting', async ({ page }) => {
  await mockSupabase(page, {});
  await page.goto('/');

  await page.getByRole('button', { name: 'Sign In / Up' }).click();
  await page.getByText('Forgot password?').click();
  await page.getByText('Back to Sign In').click();

  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
});
