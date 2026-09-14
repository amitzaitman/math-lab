import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
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
test('installed application reloads offline', async ({page, context, baseURL, browserName}) => {
  let disconnected = false;
  const server = createServer(async (req, res) => {
    if (disconnected) { req.socket.destroy(); return; }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Connection', 'close');
    if (req.url?.startsWith('/network-probe')) { res.end('online'); return; }
    try {
      const upstream = await fetch(new URL(req.url ?? '/', baseURL!), {signal: AbortSignal.timeout(5000)});
      res.writeHead(upstream.status, {'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream'});
      res.end(Buffer.from(await upstream.arrayBuffer()));
    } catch { req.socket.destroy(); }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  async function probe() {
    return page.evaluate(async () => {
      try {
        await fetch('/network-probe?nonce=' + Math.random(), {cache:'no-store', signal: AbortSignal.timeout(3000)});
        return 'online';
      } catch (error) {
        return error instanceof DOMException && error.name === 'TimeoutError' ? 'timeout' : 'network-error';
      }
    });
  }
  try {
    await page.goto(origin + '/math-lab/');
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await expect.poll(probe).toBe('online');
    disconnected = true;
    server.closeAllConnections();
    // WebKit's automation override blocks cached navigations too.
    // Cutting this isolated origin tests an actual unavailable network instead.
    if (browserName !== 'webkit') await context.setOffline(true);
    await expect.poll(probe).toBe('network-error');
    await page.reload();
    await expect(page.getByRole('slider')).toBeVisible();
    await page.getByRole('slider').focus();
    await page.getByRole('slider').press('ArrowRight');
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow', '1');
  } finally {
    if (browserName !== 'webkit') await context.setOffline(false);
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
