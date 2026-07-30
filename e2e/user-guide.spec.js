import { test, expect } from '@playwright/test';
import { mockSupabase } from './fixtures/supabase-mock.js';

test('shows the rendered User Guide while signed out', async ({ page }) => {
  await mockSupabase(page, {});
  await page.goto('/');

  await page.getByRole('button', { name: '📖 User Guide' }).click();

  await expect(page.getByRole('heading', { name: 'BambuDB User Guide', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Print Profiles', level: 2 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Filaments', level: 2 })).toBeVisible();
  // Markdown should be rendered, not left as literal syntax.
  await expect(page.getByText('# BambuDB User Guide')).toHaveCount(0);
});
