import { test, expect } from "@playwright/test";
test.beforeEach(async ({page}) => {
  await page.goto("/tests/fixtures/foundry-runtime.html");
  await page.waitForFunction(() => !!(window as any).fixture);
});
test("autosave não levanta a lista do mestre nem recria o editor; fechar atualiza a lista", async ({page}) => {
  const title = page.locator('form[data-editor] [name="title"]');
  await title.fill("Manchete sem interrupção");
  await expect(page.locator("[data-save-state]")).toHaveText("Rascunho salvo");
  expect(await page.evaluate(() => (window as any).fixture.active())).toBe("holonews-creator-fixture");
  await expect(title).toBeFocused();
  expect(await page.evaluate(() => (window as any).fixture.configs.length)).toBe(1);
  await page.evaluate(() => (window as any).fixture.creator().close());
  await expect(page.locator(".hn-manager-row strong")).toHaveText("Manchete sem interrupção");
  expect(await page.evaluate(() => (window as any).fixture.renders.at(-1).force)).toBe(false);
  expect(await page.evaluate(() => (window as any).fixture.errors)).toEqual([]);
});
test("estrutura ProseMirror permanece visível, formata e salva HTML no rascunho", async ({page}) => {
  const body = page.getByRole("textbox", {name:"Texto da notícia",exact:true});
  await expect(body).toContainText("Texto inicial visível");
  expect((await body.boundingBox())!.height).toBeGreaterThan(200);
  expect(await body.evaluate(el => getComputedStyle(el).color)).toBe("rgb(203, 211, 223)");
  expect(await body.evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(11, 20, 28)");
  await body.fill("Texto com título");
  await page.locator("[data-heading]").click();
  await page.locator("[data-native-save]").click();
  await expect(page.locator("[data-save-state]")).toHaveText("Rascunho salvo");
  expect(await page.evaluate(async () => (await (window as any).fixture.saved()).draft.body)).toContain("<h2>Texto com título</h2>");
  await expect(page.locator("[data-live-preview] h2")).toHaveText("Texto com título");
  expect(await page.evaluate(() => (window as any).fixture.configs[0])).toMatchObject({toggled:false,collaborate:false,height:300});
});
test("fechamento durante debounce e evento tardio do editor não acessam formulário destruído", async ({page}) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.getByRole("textbox", {name:"Texto da notícia",exact:true}).fill("Rascunho salvo ao fechar");
  await page.evaluate(async () => {
    const fixture = (window as any).fixture;
    const creator = fixture.creator(), form = creator.element.querySelector("form[data-editor]");
    await creator.close();
    form.dispatchEvent(new Event("input", {bubbles:true}));
    form.dispatchEvent(new Event("change", {bubbles:true}));
    form.querySelector("prose-mirror").dispatchEvent(new Event("save"));
    await (creator as any).session.updatePreview();
    await (creator as any).session.flush();
  });
  await page.waitForTimeout(1300);
  expect(await page.evaluate(async () => (await (window as any).fixture.saved()).draft.body)).toContain("Rascunho salvo ao fechar");
  expect(await page.evaluate(() => (window as any).fixture.errors)).toEqual([]);
  expect(errors).toEqual([]);
});
test("prévia assíncrona antiga não é aplicada a uma sessão remontada", async ({page}) => {
  expect(await page.evaluate(async () => {
    const fixture = (window as any).fixture;
    const createRoot = () => {const root = document.createElement("div");root.innerHTML='<form data-editor><input name="audience" value="all"></form><div data-live-preview></div>';return root;};
    let resolve!: (html: string) => void;
    const delayed = new Promise<string>(done => {resolve=done;});
    let calls = 0;
    const first = createRoot(), second = createRoot();
    const session = fixture.makeSession(first, () => ++calls === 1 ? delayed : Promise.resolve("Nova prévia"));
    session.bind(first);
    await new Promise(done => setTimeout(done, 0));
    session.dispose();
    session.bind(second);
    await new Promise(done => setTimeout(done, 0));
    resolve("Prévia antiga");
    await new Promise(done => setTimeout(done, 0));
    session.dispose();
    return second.querySelector("[data-live-preview]")!.innerHTML;
  })).toBe("Nova prévia");
});
