import { expect, test, type Page } from '@playwright/test';

const hairColor = (page: Page) =>
  page.locator('svg [id$="-front-hair-gradient-id"] stop').nth(1).getAttribute('stop-color');

async function studio(page: Page, name: string, color: string) {
  await page.addInitScript(
    ({ name, color }) => {
      if (localStorage.getItem('overlay-test-seeded')) return;
      localStorage.setItem('vstudio_lang', 'en');
      localStorage.setItem('vstudio_onboarding_complete', 'true');
      localStorage.setItem('vstudio_desktop_notice_dismissed', 'true');
      localStorage.setItem('vstudio_active_preset', 'null');
      localStorage.setItem('vstudio_config', JSON.stringify({ name, hairColor: color }));
      localStorage.setItem('overlay-test-seeded', 'true');
    },
    { name, color },
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'OBS Integration', exact: true }).click();
  const url = await page.locator('#obs-overlay-url').inputValue();
  expect(new URL(url).searchParams.get('session')).toMatch(/^[a-f0-9]{48}$/);
  return url;
}

test('pairs OBS to its own studio and keeps live changes, counts and disconnects isolated', async ({
  browser,
  baseURL,
}) => {
  const first = await browser.newContext({ baseURL });
  const second = await browser.newContext({ baseURL });
  const obs = await browser.newContext({ baseURL });
  try {
    const editorA = await first.newPage(),
      editorB = await second.newPage();
    const urlA = await studio(editorA, 'Studio A', '#c23d60');
    const urlB = await studio(editorB, 'Studio B', '#256ea6');
    expect(urlA).not.toBe(urlB);
    const overlayA = await obs.newPage(),
      overlayB = await obs.newPage();
    await overlayA.goto(urlA);
    await overlayB.goto(urlB);
    await expect(overlayA.getByRole('img', { name: 'Studio A avatar' })).toBeVisible();
    await expect(overlayB.getByRole('img', { name: 'Studio B avatar' })).toBeVisible();
    await expect.poll(() => hairColor(overlayA)).toBe('#c23d60');
    await expect.poll(() => hairColor(overlayB)).toBe('#256ea6');
    await expect(editorA.getByRole('status').filter({ hasText: '1 overlay' })).toBeVisible();
    await expect(editorB.getByRole('status').filter({ hasText: '1 overlay' })).toBeVisible();

    await editorA.getByRole('button', { name: 'Surprise me' }).click();
    const editedColor = await editorA.evaluate(
      () => JSON.parse(localStorage.getItem('vstudio_config')!).hairColor as string,
    );
    expect(editedColor).not.toBe('#c23d60');
    await expect.poll(() => hairColor(overlayA)).toBe(editedColor);
    await expect.poll(() => hairColor(overlayB)).toBe('#256ea6');
    await editorA.reload();
    await editorA.getByRole('button', { name: 'OBS Integration', exact: true }).click();
    await expect(editorA.locator('#obs-overlay-url')).toHaveValue(urlA);
    await expect(overlayA.locator('[data-source-connected]')).toHaveAttribute('data-source-connected', 'true');

    await overlayA.close();
    await expect(editorA.getByRole('status').filter({ hasText: 'No overlay' })).toBeVisible();
    await expect(editorB.getByRole('status').filter({ hasText: '1 overlay' })).toBeVisible();
    await editorB.close();
    await expect(overlayB.locator('[data-source-connected]')).toHaveAttribute('data-source-connected', 'false');
    await expect.poll(() => hairColor(overlayB)).toBe('#256ea6');
  } finally {
    await Promise.all([first.close(), second.close(), obs.close()]);
  }
});
