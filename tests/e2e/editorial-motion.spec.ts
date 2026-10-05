import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const original = Element.prototype.animate;
    (window as any).motionLog = [];
    Element.prototype.animate = function (...args: Parameters<Element['animate']>) {
      (window as any).motionLog.push({className:this.className, text:this.textContent?.slice(0,50), frames:args[0], options:args[1]});
      return original.apply(this,args);
    };
  });
});

test("páginas e posts têm receitas distintas, persistentes e finitas", async ({ page }) => {
  await page.goto('/preview/');
  await page.locator('[data-appearance]').click();
  for (const recipe of ['fade','slide','depth','fold','aperture','signal','none']) {
    await page.locator('[name=pageMotion]').selectOption(recipe);
    await page.locator('[name=cardMotion]').selectOption('alternate');
    await page.locator('[data-test-portal-motion]').click();
    await expect(page.locator('.hn-paper')).toHaveAttribute('data-motion-recipe',recipe);
    await page.waitForFunction(()=>!document.getAnimations().some(a=>a.playState==='running'));
    await expect(page.locator('.hn-page-trace')).toHaveCount(0);
    await page.locator('[data-appearance]').click();
  }
  await page.locator('[name=pageMotion]').selectOption('slide');
  await expect(page.locator('[data-preference-status]')).toHaveText('Preferências salvas para você.');
  await page.locator('.demo-close-appearance').click();
  await page.reload();
  await expect(page.locator('.demo-stage .hsn-window')).toHaveAttribute('data-hn-page-motion','slide');
  await page.locator('.hn-card').first().scrollIntoViewIfNeeded();
  await expect(page.locator('.hn-card').first()).toHaveAttribute('data-motion-recipe','alternate');
  const log = await page.evaluate(()=>(window as any).motionLog);
  expect(log.some((x:any)=>String(x.className).includes('hn-card') && JSON.stringify(x.frames).includes('translateX'))).toBe(true);
});

test("voltar restaura rolagem e foco do post, inclusive com animação desativada",async({page})=>{
  await page.goto('/preview/');
  await page.locator('#demo-reduce-motion').check();
  const link=page.locator('.hn-card [data-open]').first();
  await link.scrollIntoViewIfNeeded();
  const id=await link.getAttribute('data-open');
  const scroll=await page.locator('.hn-portal').evaluate(e=>e.scrollTop);
  expect(scroll).toBeGreaterThan(0);
  await link.click();
  await expect(page.locator('.hn-article')).toHaveAttribute('data-article-id',id!);
  await page.locator('[data-back]').click();
  expect(await page.locator('.hn-portal').evaluate(e=>e.scrollTop)).toBeCloseTo(scroll,0);
  await expect(page.locator(`[data-open="${id}"]`).first()).toBeFocused();
});

test("capa e leitura publicadas animam no leitor e param com movimento reduzido",async({page})=>{
  await page.goto('/preview/');
  await page.locator('#demo-reader').selectOption('gm');
  await page.locator('[data-mode=manager]').click();
  await page.locator('[data-edit="demo000000000000"]').first().click();
  await page.locator('[data-writing-tab=motion]').click();
  await page.locator('[name=motionCover]').selectOption('reveal');
  await page.locator('[name=motionReading]').selectOption('lateral');
  await page.locator('[name=motionEntry]').selectOption('none');
  await page.locator('[data-test-entry]').click();
  await expect(page.locator('.hn-cover-band')).toHaveCount(5);
  await expect(page.locator('.hn-cover-band')).toHaveCount(0);
  await page.locator('[data-publish]').click();
  await expect(page.locator('[data-status]')).toHaveText('Publicada');
  await page.locator('[data-mode=portal]').click();
  await page.locator('.hn-lead [data-open]').first().click();
  await expect(page.locator('.hn-article')).toHaveAttribute('data-cover-motion','reveal');
  await expect(page.locator('.hn-article')).toHaveAttribute('data-reading-motion','lateral');
  await page.evaluate(()=>(window as any).motionLog=[]);
  await page.locator('.hn-article-body p').first().scrollIntoViewIfNeeded();
  await expect.poll(async()=>page.evaluate(()=>(window as any).motionLog.some((x:any)=>JSON.stringify(x.frames).includes('translateX')))).toBe(true);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(async()=>page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
  await expect(page.locator('.hn-fx-trace')).toHaveCount(0);
  await expect(page.locator('.hn-article-body p').first()).toBeVisible();
});

test("todas as capas e entradas de cartão limpam os efeitos e suportam janela estreita",async({page})=>{
  await page.goto('/preview/');
  await page.locator('[data-appearance]').click();
  for(const recipe of ['rise','alternate','depth','unfold','editorial','none']) {
    await page.locator('[name=cardMotion]').selectOption(recipe);
    await page.locator('[data-test-portal-motion]').click();
    await page.locator('.hn-portal').evaluate(e=>e.scrollTop=700);
    await expect(page.locator('.hn-card').first()).toHaveAttribute('data-motion-recipe',recipe);
    await page.waitForFunction(()=>!document.getAnimations().some(a=>a.playState==='running'));
    await page.locator('[data-appearance]').click();
  }
  await page.locator('.demo-close-appearance').click();
  await page.locator('#demo-reader').selectOption('gm');await page.locator('[data-mode=manager]').click();await page.locator('[data-edit="demo000000000000"]').first().click();
  await page.locator('[data-writing-tab=motion]').click();
  for(const cover of ['entry','focus','pan','reveal','frame','none']) {
    await page.locator('[name=motionCover]').selectOption(cover);await page.locator('[data-test-entry]').click();
    await page.waitForFunction(()=>!document.getAnimations().some(a=>a.playState==='running'));
    await expect(page.locator('.hn-fx-trace')).toHaveCount(0);
  }
  await page.setViewportSize({width:390,height:900});
  expect(await page.locator('.hn-creator').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
});
