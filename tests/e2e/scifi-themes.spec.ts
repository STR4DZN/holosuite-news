import { test, expect } from "@playwright/test";

const themes=['orbital','pulsar','nexo'];
for(const theme of themes) {
  test(`${theme}: composição própria, diagramas finitos e leitura estreita`,async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/preview/');await page.locator('[data-appearance]').click();await page.locator(`[data-theme-choice=${theme}]`).click();
    const active=await page.locator('.hn-categories .is-active').evaluate(e=>{const s=getComputedStyle(e);return {color:s.color,background:s.backgroundImage}});
    expect(active.background).toContain('gradient');
    expect(active.color).not.toBe('transparent');
    await page.locator('[data-test-portal-motion]').click();
    await expect(page.locator('.hn-sci-diagram')).toHaveCount(1);
    await expect(page.locator('.hn-sci-diagram')).toHaveAttribute('aria-hidden','true');
    expect(await page.locator('.hn-sci-routes path').count()).toBeGreaterThan(0);
    await page.waitForFunction(()=>!document.getAnimations().some(a=>a.playState==='running'));
    await page.locator('.hn-card').first().scrollIntoViewIfNeeded();
    await expect(page.locator('.hn-sci-index').first()).toHaveText('01');
    await page.waitForFunction(()=>!document.getAnimations().some(a=>a.playState==='running'));
    await expect.poll(async()=>page.locator('.hn-card').first().evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
    const display=await page.locator('.hn-grid').evaluate(e=>getComputedStyle(e).display);
    expect(display).toBe(theme==='nexo'?'flex':'grid');
    if(theme==='nexo'){
      expect(await page.locator('.hn-card>button.hn-story-link').first().evaluate(e=>getComputedStyle(e).display)).toBe('grid');
      expect(await page.locator('.hn-card-image').first().evaluate(e=>e.getBoundingClientRect().width)).toBeLessThan(300);
    }
    await page.locator('.hn-lead [data-open]').first().click();
    await expect(page.locator('.hn-article .hn-sci-ruler')).toHaveCount(1);
    await expect(page.locator('.hn-article-body')).toContainText('06h14');
    await page.emulateMedia({reducedMotion:'reduce'});
    await expect.poll(async()=>page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
    await page.setViewportSize({width:390,height:900});
    expect(await page.locator('.hn-portal').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
    await page.locator('[data-back]').click();
    expect(await page.locator('.hn-portal').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
    await page.locator('[data-appearance]').click();await page.locator('[data-theme-choice=prisma]').click();await page.locator('.demo-close-appearance').click();
    await expect(page.locator('.hn-sci-diagram,.hn-sci-frame,.hn-sci-index')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("troca entre temas sci-fi preserva editor, escolhas e remove adornos da vista anterior",async({page})=>{
  await page.goto('/tests/fixtures/foundry-runtime.html');await page.waitForFunction(()=>!!(window as any).fixture);
  await page.locator('prose-mirror').evaluate(e=>(window as any).originalEditor=e);
  const before=await page.locator('prose-mirror').evaluate((e:any)=>e.value);
  for(const theme of themes){
    await page.evaluate(async theme=>{await (window as any).game.settings.set('holosuite-news','theme',theme)},theme);
    await expect(page.locator('#holonews-creator-fixture').first()).toHaveAttribute('data-hn-theme',theme);
    expect(await page.locator('prose-mirror').evaluate(e=>e===(window as any).originalEditor)).toBe(true);
    expect(await page.locator('prose-mirror').evaluate((e:any)=>e.value)).toBe(before);
    await expect(page.locator('#holonews-creator-fixture .hn-sci-ruler')).toHaveCount(1);
  }
  await page.evaluate(async()=>{await (window as any).game.settings.set('holosuite-news','theme','prisma')});
  await expect(page.locator('.hn-sci-ruler')).toHaveCount(0);
});
