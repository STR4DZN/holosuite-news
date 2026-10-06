import { test,expect } from '@playwright/test';

test('botão publica para todos e alerta dois leitores com o portal fechado, sem repetir ao reconectar',async({page,context})=>{
 await context.addInitScript(()=>Object.defineProperty(Crypto.prototype,'randomUUID',{value:undefined,configurable:true}));
 await page.goto('/preview/');await page.locator('#demo-reader').selectOption('gm');
 const player=await context.newPage(),iris=await context.newPage();
 await player.goto('/preview/');await iris.goto('/preview/');await iris.locator('#demo-reader').selectOption('iris');
 // Readers have no app content mounted: the overlay must be independent of the portal window.
 await player.locator('.demo-stage').evaluate(e=>(e as HTMLElement).hidden=true);
 await iris.locator('.demo-stage').evaluate(e=>(e as HTMLElement).hidden=true);
 await page.locator('[data-mode=manager]').click();await page.locator('[data-edit="demo000000000004"]').first().click();
 await page.locator('[name=title]').fill('Evacuação imediata da Estação Nove');
 await page.locator('[name=summary]').fill('A rede civil confirmou o risco. Procurem os abrigos indicados.');
 await page.locator('[data-broadcast-urgent]').click();
 for(const client of [page,player,iris]){
  await expect(client.locator('.hn-urgent-overlay')).toHaveCount(1);
  await expect(client.locator('.hn-urgent-panel h2')).toHaveText('Evacuação imediata da Estação Nove');
  await expect(client.locator('.hn-urgent-overlay')).not.toContainText('Gancho:');
 }
 await expect(page.locator('[data-save-state]')).toHaveText('Alerta global enviado');
 await expect(page.locator('[name=audience]')).toHaveValue('all');await expect(page.locator('[name=urgent]')).toBeChecked();
 await player.locator('.demo-stage').evaluate(e=>(e as HTMLElement).hidden=false);
 await player.locator('[data-urgent-read]').click();await expect(player.locator('.hn-article h1')).toHaveText('Evacuação imediata da Estação Nove');await expect(player.locator('.hn-urgent-overlay')).toHaveCount(0);
 await iris.locator('[data-urgent-close]').click();await expect(iris.locator('.hn-urgent-overlay')).toHaveCount(0);
 await page.locator('[data-urgent-close]').click();await page.locator('[data-broadcast-urgent]').click();
 await expect(iris.locator('.hn-urgent-overlay')).toHaveCount(1);await expect(player.locator('.hn-urgent-overlay')).toHaveCount(1);
 await iris.reload();await expect(iris.locator('.hn-urgent-overlay')).toHaveCount(0);
});

test('alerta no fluxo nativo termina, cabe em 390 px, respeita redução e revalida permissão',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/tests/fixtures/foundry-runtime.html');await page.waitForFunction(()=>!!(window as any).fixture);
 await page.evaluate(async()=>{
  const f=(window as any).fixture;await f.creator().close();await f.manager.close();(window as any).game.user={id:'player',isGM:false};f.settings.reduceMotion=false;f.settings.motionStyle='full';
  f.opened=[];f.alerts=f.makeAlerts(async(id:string)=>{f.closedBeforeOpen=!document.querySelector('.hn-urgent-overlay');f.opened.push(id);});f.allowed=true;
  const original=(await f.saved()).draft;f.a={...original,title:'Alerta global da rede civil',summary:'Uma emergência exige atenção imediata.',urgent:true,audience:{mode:'all',users:[]},motion:{entry:'none',alert:'none',strength:'low',pace:'quick',priority:'urgent'}};
  f.token={id:'first',sentAt:Date.now()};f.doc={id:'public-urgent',getFlag:(_s:string,k:string)=>k==='kind'?'article':k==='article'?f.a:k==='urgentBroadcast'?f.token:null,testUserPermission:()=>f.allowed};
  f.alerts.observe(f.doc,'gm');f.alerts.observe(f.doc,'gm');
 });
 await expect(page.locator('.hn-urgent-overlay')).toHaveCount(1);expect(await page.evaluate(()=>document.getAnimations().some(a=>a.playState==='running'))).toBe(true);
 await page.waitForFunction(()=>!document.getAnimations().some(a=>a.playState==='running'),{},{timeout:7000});
 await page.setViewportSize({width:390,height:900});expect(await page.locator('.hn-urgent-panel').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);await expect(page.locator('[data-urgent-read]')).toBeInViewport();
 await page.locator('[data-urgent-read]').click();expect(await page.evaluate(()=>(window as any).fixture.opened)).toEqual(['fixture']);
 await expect(page.locator('.hn-urgent-overlay')).toHaveCount(0);expect(await page.evaluate(()=>(window as any).fixture.closedBeforeOpen)).toBe(true);
 await page.evaluate(()=>{const f=(window as any).fixture;f.settings.reduceMotion=true;f.token={id:'second',sentAt:Date.now()};f.alerts.observe(f.doc,'gm');});
 await expect(page.locator('.hn-urgent-overlay')).toHaveCount(1);expect(await page.evaluate(()=>document.getAnimations().some(a=>a.playState==='running'))).toBe(false);
 await page.evaluate(()=>{const f=(window as any).fixture;f.allowed=false;f.alerts.permissionsChanged();});await expect(page.locator('.hn-urgent-overlay')).toHaveCount(0);expect(errors).toEqual([]);
});

test('prime não repete alertas antigos, origem jogador não emite alerta global e exclusão limpa a tela',async({page})=>{
 await page.goto('/tests/fixtures/foundry-runtime.html');await page.waitForFunction(()=>!!(window as any).fixture);
 await page.evaluate(async()=>{
  const f=(window as any).fixture;await f.creator().close();await f.manager.close();(window as any).game.user={id:'player',isGM:false};
  const a={...(await f.saved()).draft,urgent:true,audience:{mode:'all',users:[]},motion:{entry:'none',alert:'none',priority:'urgent'}};
  f.token={id:'history',sentAt:Date.now()};f.doc={id:'native',getFlag:(_s:string,k:string)=>k==='kind'?'article':k==='article'?a:k==='urgentBroadcast'?f.token:null,testUserPermission:()=>true};
  f.alerts=f.makeAlerts(async()=>{});f.alerts.prime([f.doc]);f.alerts.observe(f.doc,'gm');
 });
 await expect(page.locator('.hn-urgent-overlay')).toHaveCount(0);
 await page.evaluate(()=>{const f=(window as any).fixture;f.token={id:'forged',sentAt:Date.now()};f.alerts.observe(f.doc,'player');});await expect(page.locator('.hn-urgent-overlay')).toHaveCount(0);
 await page.evaluate(()=>{const f=(window as any).fixture;f.token={id:'legitimate',sentAt:Date.now()};f.alerts.observe(f.doc,'gm');});await expect(page.locator('.hn-urgent-overlay')).toHaveCount(1);
 await page.evaluate(()=>{const f=(window as any).fixture;f.doc.getFlag('holosuite-news','article').audience={mode:'selected',users:['player']};f.alerts.observe(f.doc,'gm');});await expect(page.locator('.hn-urgent-overlay')).toHaveCount(0);
 await page.evaluate(()=>{const f=(window as any).fixture;f.doc.getFlag('holosuite-news','article').audience={mode:'all',users:[]};f.token={id:'third',sentAt:Date.now()};f.alerts.observe(f.doc,'gm');});await expect(page.locator('.hn-urgent-overlay')).toHaveCount(1);
 await page.evaluate(()=>(window as any).fixture.alerts.remove((window as any).fixture.doc));await expect(page.locator('.hn-urgent-overlay')).toHaveCount(0);
});

test('segundo GM abre gerente e criador sem remontar o ProseMirror nem perder texto',async({page})=>{
 await page.goto('/tests/fixtures/foundry-runtime.html');await page.waitForFunction(()=>!!(window as any).fixture);
 await page.evaluate(()=>{const g=(window as any).game;g.users.push({id:'a',name:'Outro mestre',isGM:true,active:true});});
 await page.locator('.editor-content').fill('Texto escrito pelo segundo GM');await page.locator('.editor-content').dispatchEvent('input');await page.locator('[data-save]').click();await expect(page.locator('[data-save-state]')).toHaveText('Rascunho salvo');
 await page.evaluate(async()=>{const f=(window as any).fixture;await f.creator().close();await f.manager.render({force:true});await f.manager.edit('fixture');});
 await expect(page.locator('prose-mirror')).toContainText('Texto escrito pelo segundo GM');
 expect(await page.evaluate(()=>(window as any).fixture.errors)).toEqual([]);
});

test('mudança para movimento reduzido cancela um alerta ativo e mantém Abrir notícia',async({page})=>{
 await page.goto('/preview/');await page.locator('#demo-reader').selectOption('gm');await page.locator('[data-mode=manager]').click();await page.locator('[data-edit="demo000000000000"]').first().click();
 await page.locator('[data-broadcast-urgent]').click();await expect(page.locator('.hn-urgent-overlay')).toHaveCount(1);
 await page.locator('#demo-reduce-motion').check();await page.waitForFunction(()=>!document.getAnimations().some(a=>a.playState==='running'));
 await expect(page.locator('[data-urgent-read]')).toBeVisible();await page.locator('[data-urgent-close]').click();await expect(page.locator('.hn-urgent-overlay')).toHaveCount(0);
});

test('texto longo e conteúdo literal ficam legíveis; redução já ativa não inicia movimento',async({page})=>{
 await page.setViewportSize({width:390,height:900});await page.goto('/preview/');await page.locator('#demo-reduce-motion').check();await page.locator('#demo-reader').selectOption('gm');await page.locator('[data-mode=manager]').click();await page.locator('[data-edit="demo000000000000"]').first().click();
 const title='<img src=x onerror=alert(1)> '+('Emergência civil ').repeat(12);await page.locator('[name=title]').fill(title);await page.locator('[name=summary]').fill('Procurem os abrigos indicados. '.repeat(30));await page.locator('[data-broadcast-urgent]').click();await expect(page.locator('.hn-urgent-panel h2')).toHaveText(title);
 await expect(page.locator('.hn-urgent-panel img')).toHaveCount(0);await expect(page.locator('[data-urgent-read]')).toBeInViewport();expect(await page.evaluate(()=>document.getAnimations().some(a=>a.playState==='running'))).toBe(false);
 expect(await page.locator('.hn-urgent-panel').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
});

test('emergência vermelha e preta é grande e centralizada em qualquer viewport',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('/preview/');await page.locator('#demo-reduce-motion').check();await page.locator('#demo-reader').selectOption('gm');await page.locator('[data-mode=manager]').click();await page.locator('[data-edit="demo000000000000"]').first().click();
 await page.locator('[name=title]').fill('Evacuação imediata da Estação Nove');await page.locator('[name=summary]').fill('Uma emergência exige atenção imediata.');await page.locator('[data-broadcast-urgent]').click();
 for(const size of [{width:1440,height:1000},{width:1920,height:1080},{width:390,height:900},{width:900,height:500}]){
  await page.setViewportSize(size);
  const box=await page.locator('.hn-urgent-panel').boundingBox();expect(box).not.toBeNull();
  expect(Math.abs(box!.x+box!.width/2-size.width/2)).toBeLessThan(2);
  expect(Math.abs(box!.y+box!.height/2-size.height/2)).toBeLessThan(2);
  if(size.width===1440){expect(box!.width).toBeGreaterThan(1000);expect(box!.height).toBeGreaterThanOrEqual(620);}
  await expect(page.locator('[data-urgent-read]')).toBeInViewport();
  expect(await page.locator('.hn-urgent-panel').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
 }
 await expect(page.locator('.hn-urgent-panel')).toHaveCSS('background-color','rgb(9, 9, 11)');
 await expect(page.locator('.hn-urgent-panel>header')).toHaveCSS('background-color','rgb(186, 16, 40)');
 await expect(page.locator('.hn-urgent-network')).toContainText('ALERTA DE EMERGÊNCIA');
 await page.locator('[data-urgent-read]').click();await expect(page.locator('.hn-urgent-overlay')).toHaveCount(0);await expect(page.locator('.hn-article h1')).toHaveText('Evacuação imediata da Estação Nove');
});
