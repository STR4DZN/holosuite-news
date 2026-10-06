import { test,expect } from '@playwright/test';

test('mestre pode publicar silenciosamente, reabrir a opção e reativar sem perder o estilo',async({page})=>{
 await page.goto('/tests/fixtures/foundry-runtime.html');await page.waitForFunction(()=>!!(window as any).fixture);
 await expect(page.locator('[name=notify]')).toBeChecked();
 await page.locator('[data-writing-tab=motion]').click();await page.locator('[name=motionAlert]').selectOption('radar');await page.locator('[data-writing-tab=text]').click();
 await page.locator('[name=notify]').uncheck();await page.locator('[data-save]').click();await expect(page.locator('[data-save-state]')).toHaveText('Rascunho salvo');
 await page.evaluate(async()=>{const f=(window as any).fixture;await f.creator().close();await f.manager.edit('fixture');});
 await expect(page.locator('[name=notify]')).not.toBeChecked();await expect(page.locator('[name=motionAlert]')).toHaveValue('radar');
 await page.locator('[data-publish]').click();await expect(page.locator('[data-save-state]')).toHaveText('Notícia publicada');
 await page.evaluate(async()=>{const f=(window as any).fixture;f.published=(await f.saved()).published;f.alerts=f.makeAlerts(async()=>{});(window as any).game.user={id:'player',isGM:false};f.doc={id:'public-notify',getFlag:(_s:string,k:string)=>k==='kind'?'article':k==='article'?f.published:null,testUserPermission:()=>true};f.alerts.observe(f.doc,'gm');});
 await expect(page.locator('.hn-broadcast-stack')).toHaveCount(0);
 expect(await page.evaluate(()=>(window as any).fixture.published.notify)).toBe(false);
 await page.evaluate(()=>(window as any).game.user={id:'gm',isGM:true});
 await page.locator('[name=notify]').check();await expect(page.locator('[name=motionAlert]')).toHaveValue('radar');await page.locator('[data-publish]').click();await expect(page.locator('[data-save-state]')).toHaveText('Notícia publicada');
 await page.evaluate(async()=>{const f=(window as any).fixture;(window as any).game.user={id:'player',isGM:false};f.published=(await f.saved()).published;f.alerts.observe(f.doc,'gm');f.alerts.observe(f.doc,'gm');});
 await expect(page.locator('.hn-broadcast-stack .hn-publication-alert')).toHaveCount(1);await expect(page.locator('.hn-publication-alert')).toHaveAttribute('data-style','radar');
 await page.evaluate(()=>{const f=(window as any).fixture;f.published={...f.published,notify:false};f.alerts.observe(f.doc,'gm');});await expect(page.locator('.hn-broadcast-stack')).toHaveCount(0);
});

test('publicação silenciosa não impede a transmissão global urgente',async({page})=>{
 await page.goto('/tests/fixtures/foundry-runtime.html');await page.waitForFunction(()=>!!(window as any).fixture);
 await page.locator('[name=notify]').uncheck();await page.locator('[data-broadcast-urgent]').click();await expect(page.locator('[data-save-state]')).toHaveText('Alerta global enviado');
 await page.evaluate(async()=>{const f=(window as any).fixture;const item=await f.saved();f.opened=[];f.alerts=f.makeAlerts(async(id:string)=>f.opened.push(id));(window as any).game.user={id:'player',isGM:false};f.doc={id:'urgent-notify',getFlag:(_s:string,k:string)=>k==='kind'?'article':k==='article'?item.published:k==='urgentBroadcast'?item.broadcast:null,testUserPermission:()=>true};f.alerts.observe(f.doc,'gm');});
 await expect(page.locator('.hn-urgent-overlay')).toHaveCount(1);await expect(page.locator('.hn-broadcast-stack')).toHaveCount(0);
 expect(await page.evaluate(async()=>(await (window as any).fixture.saved()).published.notify)).toBe(false);
 await page.locator('[data-urgent-read]').click();await expect(page.locator('.hn-urgent-overlay')).toHaveCount(0);expect(await page.evaluate(()=>(window as any).fixture.opened)).toEqual(['fixture']);
});
