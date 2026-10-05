import { test, expect } from "@playwright/test";

test("aparência persiste por leitor e muda sem recriar o texto rico do mestre", async ({ page }) => {
  await page.goto("/preview/");
  await page.locator('[data-appearance]').click();
  await page.locator('[data-theme-choice=aurora]').click();
  await expect(page.locator('.demo-stage .hsn-window')).toHaveAttribute('data-hn-theme','aurora');
  await page.locator('[name=fontScale]').fill('1.3');
  await page.locator('[name=fontScale]').dispatchEvent('input');
  await expect(page.locator('[data-preference-status]')).toHaveText('Preferências salvas para você.');
  await page.locator('.demo-close-appearance').click();
  await page.reload();
  await expect(page.locator('.demo-stage .hsn-window')).toHaveAttribute('data-hn-theme','aurora');
  await page.locator('#demo-reader').selectOption('gm');
  await expect(page.locator('.demo-stage .hsn-window')).toHaveAttribute('data-hn-theme','prisma');
  await page.locator('[data-mode=manager]').click();
  await page.locator('[data-edit="demo000000000000"]').first().click();
  await page.getByRole('textbox',{name:'Texto da notícia',exact:true}).fill('Texto que precisa permanecer no editor.');
  await page.locator('prose-mirror').evaluate(e=>(window as any).originalRich=e);
  await page.locator('[data-appearance]').click();
  await page.locator('[data-theme-choice=gazeta]').click();
  await page.locator('.demo-close-appearance').click();
  expect(await page.locator('prose-mirror').evaluate(e=>e===(window as any).originalRich)).toBe(true);
  await expect(page.getByRole('textbox',{name:'Texto da notícia',exact:true})).toHaveText('Texto que precisa permanecer no editor.');
  await page.locator('[data-writing-tab=motion]').click();
  await page.locator('[name=motionEntry]').selectOption('hologram');
  await page.locator('[name=motionAlert]').selectOption('critical');
  await page.locator('[name=motionPriority]').selectOption('urgent');
  await page.locator('[data-test-alert]').click();
  await expect(page.locator('[data-alert-preview] .hn-publication-alert')).toHaveAttribute('data-style','critical');
  await expect(page.locator('[data-alert-preview]')).not.toContainText('Gancho:');
  await page.locator('[data-alert-preview] [data-alert-close]').click();
  await page.locator('[data-publish]').click();
  await expect(page.locator('[data-status]')).toHaveText('Publicada');
  await page.locator('[data-mode=portal]').click();
  await page.locator('#demo-reader').selectOption('player');
  await expect(page.locator('.demo-stage .hsn-window')).toHaveAttribute('data-hn-theme','aurora');
  await page.locator('.hn-lead [data-open]').first().click();
  await expect(page.locator('.hn-article')).toHaveAttribute('data-entry','hologram');
  await expect(page.locator('.hn-article-alert')).toContainText('Muito urgente');
});

test("notificações respeitam público e permissão, não repetem snapshots e abrem a notícia", async ({ page }) => {
  await page.goto('/tests/fixtures/foundry-runtime.html');
  await page.waitForFunction(()=>!!(window as any).fixture);
  await page.evaluate(async()=>{
    const f=(window as any).fixture;
    await f.creator().close();await f.manager.close();
    (window as any).game.user={id:'player',isGM:false};
    f.opened=[];
    f.alerts=f.makeAlerts(async(id:string)=>f.opened.push(id));
    f.doc=(article:any,allowed=true)=>({getFlag:(_module:string,key:string)=>key==='kind'?'article':key==='article'?article:0,testUserPermission:()=>allowed});
    const original=(await f.saved()).draft;
    f.publicArticle={...original,title:'Aviso urgente',body:'<p>Texto público</p>',urgent:true,motion:{entry:'signal',alert:'critical',strength:'high',pace:'cinema',priority:'urgent'}};
    f.base=f.doc(f.publicArticle);
    f.alerts.prime([f.base]);f.alerts.observe(f.base);
  });
  await expect(page.locator('.hn-broadcast-stack')).toHaveCount(0);
  await page.evaluate(()=>{const f=(window as any).fixture;f.current=f.doc({...f.publicArticle,title:'Nova notícia urgente'});f.alerts.observe(f.current);f.alerts.observe(f.current);});
  await expect(page.locator('.hn-broadcast-stack .hn-publication-alert')).toHaveCount(1);
  await expect(page.locator('.hn-broadcast-stack')).not.toContainText('Notas');
  await page.locator('.hn-broadcast-stack [data-alert-read]').click();
  expect(await page.evaluate(()=>(window as any).fixture.opened)).toEqual(['fixture']);
  await page.evaluate(()=>{const f=(window as any).fixture;
    f.alerts.observe(f.doc({...f.publicArticle,id:'gmOnly',audience:{mode:'gm',users:[]}}));
    f.alerts.observe(f.doc({...f.publicArticle,id:'selected',audience:{mode:'selected',users:['iris']}}));
    f.alerts.observe(f.doc({...f.publicArticle,id:'denied'},false));
    f.alerts.observe(f.doc({...f.publicArticle,id:'silent',motion:{...f.publicArticle.motion,alert:'none'}}));
  });
  await expect(page.locator('.hn-broadcast-stack')).toHaveCount(0);
  await page.evaluate(()=>{const f=(window as any).fixture;f.revocable=f.doc({...f.publicArticle,id:'revoke',audience:{mode:'selected',users:['player']}});f.alerts.observe(f.revocable);});
  await expect(page.locator('.hn-broadcast-stack .hn-publication-alert')).toHaveCount(1);
  await page.evaluate(()=>{const f=(window as any).fixture;(window as any).game.user={id:'someone',isGM:false};f.alerts.permissionsChanged();});
  await expect(page.locator('.hn-broadcast-stack')).toHaveCount(0);
});

test("seis estilos cabem no portal estreito e a leitura permanece neutra", async ({ page }) => {
  await page.goto('/preview/');await page.locator('#demo-reduce-motion').check();
  await page.setViewportSize({width:390,height:900});
  for(const theme of ['prisma','gazeta','obsidiana','aurora','terminal','dossie']) {
    await page.locator('[data-appearance]').click();await page.locator(`[data-theme-choice=${theme}]`).click();await page.locator('.demo-close-appearance').click();
    expect(await page.locator('.hn-portal').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
    await page.locator('.hn-lead [data-open]').first().click();
    expect(await page.locator('.hn-portal').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator('.hn-article-body')).toContainText('06h14');
    expect(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
    await page.locator('[data-back]').click();
  }
});

test("testar efeitos termina e reduzir movimento interrompe efeitos em andamento", async ({ page }) => {
  await page.goto('/preview/');await page.locator('#demo-reader').selectOption('gm');await page.locator('[data-mode=manager]').click();await page.locator('[data-edit="demo000000000000"]').first().click();
  await page.locator('[data-writing-tab=motion]').click();
  await page.locator('[name=motionEntry]').selectOption('signal');await page.locator('[name=motionPace]').selectOption('cinema');
  await page.waitForTimeout(400);await page.locator('[data-test-entry]').click();
  await expect(page.locator('.hn-fx-trace')).toHaveCount(1);
  await expect(page.locator('.hn-fx-trace')).toHaveCount(0);
  await page.locator('[name=motionAlert]').selectOption('critical');await page.locator('[data-test-alert]').click();
  expect(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)).toBeGreaterThan(0);
  await page.locator('#demo-reduce-motion').check();
  expect(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
  await expect(page.locator('[data-alert-preview]')).toContainText('Ler notícia');
});
