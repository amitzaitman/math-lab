import { expect, test } from '@playwright/test';
test('drag then finish the journey using keyboard', async ({page}) => {
  await page.goto('./');
  const slider = page.getByRole('slider');
  const box = (await slider.boundingBox())!;
  await page.mouse.move(box.x + 2, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 20, {steps: 5});
  await page.mouse.up();
  await expect(page.getByRole('status')).toContainText('בדיוק');
  await page.getByRole('button', {name:'ממשיכים'}).click();
  for (const n of [2, 6, 6, 4]) {
    await slider.focus();
    for (let i = 0; i < n; i++) await slider.press('ArrowRight');
    await expect(page.getByRole('status')).toContainText('בדיוק');
    await page.getByRole('button', {name: n === 4 ? 'סיום המסע' : 'ממשיכים'}).click();
  }
  await expect(page.getByRole('heading', {level:1})).toHaveText('חלקים שונים. אותה כמות.');
  await page.getByRole('button', {name: 'ננסה שוב'}).click();
  await expect(slider).toHaveAttribute('aria-valuenow', '0');
});
test('touch tap selects a fraction', async ({page, isMobile}) => {
  test.skip(!isMobile, 'Touch-enabled project');
  await page.goto('./');
  const slider = page.getByRole('slider');
  const box = (await slider.boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + 20);
  await expect(slider).toHaveAttribute('aria-valuenow', '2');
  await expect(page.getByRole('status')).toContainText('בדיוק');
});
test('pointer cancellation restores the committed value', async ({page}) => {
  await page.goto('./');
  const slider = page.getByRole('slider');
  const box = (await slider.boundingBox())!;
  await page.mouse.move(box.x + 4, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 20);
  await slider.dispatchEvent('pointercancel', {pointerId: 1});
  await page.mouse.up();
  await expect(slider).toHaveAttribute('aria-valuenow', '0');
  await expect(page.getByRole('button', {name:'ממשיכים'})).toHaveCount(0);
});
test('installed application reloads offline', async ({page, context}) => {
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {once:true}));
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('slider')).toBeVisible();
  await page.getByRole('slider').focus();
  await page.getByRole('slider').press('ArrowRight');
  await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow', '1');
});
