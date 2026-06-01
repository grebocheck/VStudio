import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const seedStorage = async (
  page: Page,
  values: Record<string, unknown> = {},
  rawValues: Record<string, string> = {},
) => {
  await page.addInitScript(
    ({ json, raw }) => {
      window.localStorage.clear();
      Object.entries(json).forEach(([key, value]) => window.localStorage.setItem(key, JSON.stringify(value)));
      Object.entries(raw).forEach(([key, value]) => window.localStorage.setItem(key, value));
    },
    { json: values, raw: rawValues },
  );
};

const expectNoAxeViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.map(({ id, nodes }) => ({
    id,
    targets: nodes.map(({ target }) => target.join(' ')),
  }));
  expect(violations).toEqual([]);
};

for (const theme of ['dark', 'light']) {
  test(`has no automatically detectable accessibility violations in the ${theme} workspace`, async ({ page }) => {
    await seedStorage(page, { vstudio_onboarding_complete: true }, { vstudio_theme: theme });
    await page.goto('/');

    await expect(page.getByRole('banner')).toBeVisible();
    await expectNoAxeViolations(page);
  });
}

test('keeps onboarding keyboard focus trapped and supports keyboard completion', async ({ page }) => {
  await seedStorage(page);
  await page.goto('/');

  const dialog = page.getByRole('dialog');
  const next = dialog.getByRole('button', { name: 'Next' });
  const skip = dialog.getByRole('button', { name: 'Skip tour' }).first();

  await expect(dialog).toBeVisible();
  await expect(next).toBeFocused();
  await expectNoAxeViolations(page);

  await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(next).toBeFocused();

  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
});
