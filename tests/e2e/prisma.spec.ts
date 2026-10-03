import {test, expect} from "@playwright/test";

test("Prisma no adaptador: marca da campanha, capa sem imagem e leitura ampliada em janela estreita", async ({page}) => {
  const errors: string[]=[];
  page.on("pageerror", e=>errors.push(e.message));
  await page.goto("/tests/fixtures/foundry-runtime.html");
  await page.waitForFunction(()=>!!(window as any).fixture);
  await page.evaluate(async ()=>{
    const f=(window as any).fixture;
    await f.creator().close(); await f.manager.close();
    const item=await f.saved();
    item.draft.title="Uma reportagem do Consórcio além das rotas conhecidas";
    item.draft.category="Exploração Paracausal";
    item.draft.featured=true;
    item.draft.author="Lia Voss";
    item.draft.body='<p>'+"O relato percorre mundos e acompanha a rede civil. ".repeat(70)+'</p>';
    const saved=await f.room.save(item.id,item.draft,item.notes,item.revision);
    await f.room.publish(item.id,saved.revision);
    Object.assign(f.settings,{portalName:"Gazeta do Consórcio — Horizonte",portalLocation:"Rede de Carina",portalTagline:"As vozes da sua campanha",fontScale:1.4});
    f.portal=await f.openReader();
    f.portal.element.style.cssText="width:360px;height:820px;margin:0;position:relative";
  });
  await expect(page.locator(".hn-brand strong")).toContainText("Gazeta do Consórcio — Horizonte");
  await expect(page.locator(".hn-masthead p")).toHaveText("As vozes da sua campanha");
  await expect(page.locator(".hn-lead-image")).toHaveCount(0);
  expect((await page.locator(".hn-lead").boundingBox())!.height).toBeLessThan(635);
  expect(await page.locator(".hn-portal").evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator(".hn-portal")).not.toContainText("2186");
  await page.locator(".hn-lead [data-open]").click();
  await expect(page.locator(".article-edition")).toContainText("Gazeta do Consórcio — Horizonte");
  await expect(page.locator(".article-edition")).toContainText("4 min de leitura");
  await expect(page.locator(".hn-author-mark")).toHaveText("LV");
  expect(await page.locator(".hn-article-body").evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThan(21);
  expect(await page.locator(".hn-portal").evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
  expect(await page.locator(".hn-article").getAttribute("data-tone")).toMatch(/^[0-4]$/);
  expect(errors).toEqual([]);
});

test("Prisma mantém texto rico e prévia acessíveis em criador estreito", async ({page})=>{
  await page.goto("/tests/fixtures/foundry-runtime.html");
  await page.waitForFunction(()=>!!(window as any).fixture);
  await page.evaluate(()=>{
    const f=(window as any).fixture;
    f.creator().element.style.cssText="width:360px;height:820px;margin:0;position:relative";
    f.manager.element.hidden=true;
  });
  await page.setViewportSize({width:390,height:900});
  expect(await page.locator(".hn-creator").evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
  const body=page.getByRole("textbox",{name:"Texto da notícia",exact:true});
  await body.scrollIntoViewIfNeeded();
  await expect(body).toBeVisible();
  expect((await body.boundingBox())!.height).toBeGreaterThan(200);
  await body.fill("Texto no editor estreito");
  await expect(page.locator("[data-save-state]")).toHaveText("Rascunho salvo");
  await page.locator("[data-live-preview]").scrollIntoViewIfNeeded();
  await expect(page.locator("[data-live-preview] .hn-article-body")).toContainText("Texto no editor estreito");
});

test("Prisma no portal: categorias próprias têm a mesma cor na lista e na notícia; modo reduzido", async ({page})=>{
  await page.goto("/preview/");
  await page.locator("#demo-reader").selectOption("gm");
  await page.locator('[data-mode="manager"]').click();
  await page.locator('[data-edit="demo000000000000"]').first().click();
  await page.locator('[name="category"]').fill("Frota de Carina");
  await page.locator('[data-publish]').click();
  await expect(page.locator('[data-status]')).toHaveText("Publicada");
  await page.locator('[data-mode="portal"]').click();
  await page.locator("#demo-reader").selectOption("player");
  await page.locator("#demo-reduce-motion").check();
  const tone=await page.locator('.hn-lead').getAttribute('data-tone');
  const color=await page.locator('.hn-lead').evaluate(e=>getComputedStyle(e).getPropertyValue('--channel'));
  await page.locator('.hn-lead [data-open]').first().click();
  await expect(page.locator('.hn-article')).toHaveAttribute('data-tone',tone!);
  expect(await page.locator('.hn-article').evaluate(e=>getComputedStyle(e).getPropertyValue('--channel'))).toBe(color);
  expect(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
  await expect(page.locator('[data-mode="manager"]')).toBeHidden();
  await expect(page.locator('.hn-portal [data-edit], .hn-portal [name="notes"]')).toHaveCount(0);
});
