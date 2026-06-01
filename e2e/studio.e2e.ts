import { expect, test, type Page } from '@playwright/test';

const seedStorage = async (page: Page, values: Record<string, unknown> = {}) => {
  await page.addInitScript((entries) => {
    if (window.sessionStorage.getItem('vstudio_e2e_seeded')) return;
    window.localStorage.clear();
    Object.entries(entries).forEach(([key, value]) => window.localStorage.setItem(key, JSON.stringify(value)));
    window.sessionStorage.setItem('vstudio_e2e_seeded', 'true');
  }, values);
};

test('guides a first run and can be reopened from the toolbar', async ({ page }) => {
  await seedStorage(page);
  await page.goto('/');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Start from a character preset' })).toBeVisible();

  await dialog.getByRole('button', { name: 'Next' }).click();
  await expect(dialog.getByRole('heading', { name: 'Pick a live tracking mode' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Rigging & Calibration/ })).toHaveAttribute('aria-current', 'page');

  await dialog.getByRole('button', { name: 'Next' }).click();
  await dialog.getByRole('button', { name: 'Next' }).click();
  await expect(dialog.getByRole('heading', { name: 'Send the avatar to OBS' })).toBeVisible();
  await expect(page.getByRole('button', { name: /OBS Integration/ })).toHaveAttribute('aria-current', 'page');

  await dialog.getByRole('button', { name: 'Start creating' }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(dialog).toBeHidden();

  const openTour = page.getByRole('button', { name: 'Open quick tour' });
  await openTour.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(openTour).toBeFocused();
});

test('shows a dismissible desktop recommendation on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedStorage(page, { vstudio_onboarding_complete: true });
  await page.goto('/');

  const notice = page.getByRole('alert');
  await expect(notice.getByRole('heading', { name: 'Desktop workspace recommended' })).toBeVisible();
  await notice.getByRole('button', { name: 'Dismiss desktop recommendation' }).click();
  await expect(notice).toBeHidden();

  await page.reload();
  await expect(notice).toBeHidden();
});

test('serves a chrome-free OBS overlay route', async ({ page }) => {
  await page.goto('/overlay');

  await expect(page.locator('#root > div')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.style.background)).toBe('transparent');
  await expect(page.locator('header')).toHaveCount(0);
  await expect(page.locator('aside')).toHaveCount(0);
});
