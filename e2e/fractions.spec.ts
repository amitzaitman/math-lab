import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, test, type Page } from '@playwright/test';
const chip=(page:Page,id:number)=>page.getByRole('button',{name:new RegExp('^חתיכה '+id+',')});
const cut=(page:Page,ratio:string)=>page.getByRole('button',{name:'חיתוך בנקודה '+ratio,exact:true});
const pieces=(page:Page)=>page.getByRole('group',{name:'בחירת חתיכות'}).getByRole('button');
async function place(page:Page,id:number,slot:number){
  await chip(page,id).click();
  await page.getByRole('button',{name:'הנחה במסגרת '+slot,exact:true}).click();
}
test('cut, undo, redo, join, and complete via accessible controls',async({page},testInfo)=>{
  await page.goto('./');
  await expect(page.locator('.help-panel')).toHaveCount(0);
  await expect(page.getByRole('slider')).toHaveCount(0);
  await cut(page,'1/2').focus();await cut(page,'1/2').press('Enter');
  await expect(pieces(page)).toHaveCount(2);
  await page.getByRole('button',{name:'ביטול',exact:true}).click();
  await expect(pieces(page)).toHaveCount(1);
  await page.getByRole('button',{name:'ביצוע מחדש',exact:true}).click();
  await expect(pieces(page)).toHaveCount(2);
  await chip(page,2).click();await chip(page,3).click();
  await page.getByRole('button',{name:'חיבור החתיכות שנבחרו'}).click();
  await expect(pieces(page)).toHaveCount(1);
  await cut(page,'1/2').click();
  await place(page,5,1);await place(page,6,2);
  await expect(page.getByRole('button',{name:'הפעילות הבאה'})).toBeEnabled();
  await page.screenshot({path:testInfo.outputPath('assembled.png'),fullPage:true});
  await page.getByRole('button',{name:'הפעילות הבאה'}).click();
  await expect(page.getByRole('button',{name:'חצי בשתי דרכים',exact:true})).toHaveAttribute('aria-current','step');
  await cut(page,'1/2').click();await place(page,2,1);await place(page,3,1);
  await expect(page.getByRole('button',{name:'הפעילות הבאה'})).toBeEnabled();
});
test('real canvas drag snaps a cut piece to a target',async({page})=>{
  await page.goto('./');await cut(page,'1/2').click();
  const box=(await page.getByTestId('table').boundingBox())!;
  const point=(x:number,y:number)=>({x:box.x+x*box.width/960,y:box.y+y*box.width/960});
  const a=point(240,460),b=point(250,210);
  await page.mouse.move(a.x,a.y);await page.mouse.down();
  await page.mouse.move(b.x,b.y,{steps:12});await page.mouse.up();
  await expect(chip(page,2)).toHaveAccessibleName(/במסגרת/);
  await page.getByRole('button',{name:'ביטול',exact:true}).click();
  await expect(chip(page,2)).toHaveAccessibleName(/במגש/);
});
test('touch canvas selection and tap destination work after resize',async({page,isMobile},testInfo)=>{
  test.skip(!isMobile,'Touch project');
  await page.goto('./');await cut(page,'1/2').click();
  let box=(await page.getByTestId('table').boundingBox())!;
  await page.touchscreen.tap(box.x+250*box.width/960,box.y+455*box.width/960);
  await expect(chip(page,2)).toHaveAttribute('aria-pressed','true');
  await page.touchscreen.tap(box.x+290*box.width/960,box.y+205*box.width/960);
  await expect(chip(page,2)).toHaveAccessibleName(/במסגרת/);
  await page.setViewportSize({width:844,height:390});
  box=(await page.getByTestId('table').boundingBox())!;
  await expect(page.getByTestId('table')).toBeVisible();
  expect(box.width).toBeLessThanOrEqual(844);
  await page.screenshot({path:testInfo.outputPath('landscape.png'),fullPage:true});
});
test('cancelled drag preserves quantities and placement',async({page})=>{
  await page.goto('./');await cut(page,'1/2').click();
  const box=(await page.getByTestId('table').boundingBox())!;
  const x=box.x+250*box.width/960,y=box.y+455*box.width/960;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y-50,{steps:6});
  await page.evaluate(()=>window.dispatchEvent(new Event('pointercancel')));
  await page.mouse.up();
  await expect(chip(page,2)).toHaveAccessibleName(/במגש/);
  await expect(pieces(page)).toHaveCount(2);
  await page.getByRole('button',{name:'ביטול',exact:true}).click();
  await expect(pieces(page)).toHaveCount(1);
});
test('same piece changes its fraction when the referent changes',async({page},testInfo)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('./');
  await page.getByRole('button',{name:'חצי בשתי דרכים',exact:true}).click();
  await page.getByRole('button',{name:'הצגת שברים',exact:true}).click();
  await expect(chip(page,1)).toHaveAccessibleName(/1\/2/);
  await page.getByRole('button',{name:'שינוי השלם להשוואה'}).click();
  await expect(chip(page,1)).toHaveAccessibleName('חתיכה 1, 1, במגש');
  await page.getByRole('button',{name:'ביטול',exact:true}).click();
  await expect(chip(page,1)).toHaveAccessibleName(/1\/2/);
  await page.screenshot({path:testInfo.outputPath('table.png'),fullPage:true});
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
    await expect(page.getByTestId('table').locator('canvas')).toBeVisible();
    await page.getByRole('button',{name:'חיתוך בנקודה 1/2',exact:true}).click();
    await expect(page.getByRole('group',{name:'בחירת חתיכות'}).getByRole('button')).toHaveCount(2);
  } finally {
    if (browserName !== 'webkit') await context.setOffline(false);
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
