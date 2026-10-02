import { test, expect, type Page } from "@playwright/test";
async function manager(page: Page) {
  await page.locator("#demo-reader").selectOption("gm");
  await page
    .getByRole("button", { name: "Criador do mestre", exact: true })
    .click();
}
async function portal(page: Page) {
  await page.locator('[data-mode="portal"]').click();
  await page.locator("#demo-reader").selectOption("player");
}
async function editLead(page: Page) {
  await manager(page);
  await page.locator('[data-edit="demo000000000000"]').first().click();
}
test.beforeEach(async ({ page }) => {
  await page.goto("/preview/");
});
test("portal: manchete, leitura, busca sem acento e categoria", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", {
      name: "Meridian volta a receber luz depois de nove dias de silêncio",
    }),
  ).toBeVisible();
  await page.locator('[data-open="demo000000000000"]').first().click();
  await expect(page.locator(".hn-article-body")).toContainText("06h14");
  await page.getByRole("button", { name: "Voltar às notícias" }).click();
  await page
    .getByRole("searchbox", { name: "Buscar notícias" })
    .fill("estacao");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.locator(".hn-card")).toHaveCount(1);
  await expect(page.locator(".hn-card")).toContainText("Estação Nove");
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await page.getByRole("button", { name: "Economia", exact: true }).click();
  await expect(page.locator(".hn-card")).toHaveCount(1);
  await expect(page.locator(".hn-card")).toContainText("mercado dos anéis");
});
test("público selecionado e notas ficam fora do portal", async ({ page }) => {
  await expect(page.locator(".hn-portal")).not.toContainText(
    "Arquivo restrito",
  );
  await expect(page.locator(".hn-portal")).not.toContainText("Gancho:");
  await page.locator("#demo-reader").selectOption("iris");
  await expect(page.locator(".hn-portal")).toContainText("Arquivo restrito");
});
test("criador: autosave do rascunho não muda a publicada; publicar aplica revisão", async ({
  page,
}) => {
  await editLead(page);
  await page
    .getByLabel("Título", { exact: false })
    .first()
    .fill("Nova manchete em rascunho");
  await expect(page.locator("[data-save-state]")).toHaveText("Rascunho salvo");
  await expect(page.locator("[data-live-preview] h1")).toHaveText(
    "Nova manchete em rascunho",
  );
  await portal(page);
  await expect(page.locator(".hn-lead h1")).toContainText("Meridian volta");
  await editLead(page);
  await page.getByRole("button", { name: "Publicar revisão" }).click();
  await expect(page.locator("[data-status]")).toHaveText("Publicada");
  await portal(page);
  await expect(page.locator(".hn-lead h1")).toHaveText(
    "Nova manchete em rascunho",
  );
});
test("nova notícia: texto rico, contador, público, publicação e retirada", async ({
  page,
}) => {
  await manager(page);
  await page.locator('[data-action="create"]').first().click();
  await page
    .getByLabel("Título", { exact: false })
    .first()
    .fill("Mensagem para Íris");
  await page
    .getByRole("textbox", { name: "Texto da notícia" })
    .fill("Uma mensagem da rede civil.");
  await page.getByLabel("Visualizações no universo").fill("999999");
  await page.getByLabel("Quem pode ler").selectOption("selected");
  await page.getByLabel("Íris", { exact: true }).check();
  await page.getByRole("button", { name: "Publicar notícia" }).click();
  await expect(page.locator("[data-status]")).toHaveText("Publicada");
  await portal(page);
  await expect(page.locator(".hn-portal")).not.toContainText(
    "Mensagem para Íris",
  );
  await page.locator("#demo-reader").selectOption("iris");
  await expect(page.locator(".hn-portal")).toContainText("Mensagem para Íris");
  await page.getByRole("button", { name: /Mensagem para Íris/ }).click();
  await expect(page.locator(".hn-article-body")).toHaveText(
    "Uma mensagem da rede civil.",
  );
  await expect(page.locator(".hn-views")).toContainText("999.999");
  await manager(page);
  await page
    .locator(".hn-manager-row")
    .filter({ hasText: "Mensagem para Íris" })
    .locator("[data-edit]")
    .first()
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Retirar do portal" }).click();
  await expect(page.locator("[data-status]")).toHaveText("Rascunho");
  await portal(page);
  await expect(page.locator(".hn-portal")).not.toContainText(
    "Mensagem para Íris",
  );
});
test("duplicar e excluir afeta só a cópia", async ({ page }) => {
  await manager(page);
  await page.locator('[data-duplicate="demo000000000000"]').click();
  await expect(page.locator('[name="title"]')).toHaveValue(/cópia/);
  await manager(page);
  const row = page.locator(".hn-manager-row").filter({ hasText: "— cópia" });
  await expect(row).toContainText("Rascunho");
  page.once("dialog", (dialog) => dialog.accept());
  await row.locator("[data-delete]").click();
  await expect(page.locator(".hn-manager-row")).toHaveCount(6);
});
test("erro de publicação preserva formulário e mostra causa", async ({
  page,
}) => {
  await manager(page);
  await page.locator('[data-action="create"]').first().click();
  await page.getByRole("button", { name: "Publicar notícia" }).click();
  await expect(page.locator("#demo-toast")).toContainText("título e o texto");
  await expect(page.locator("form[data-editor]")).toBeVisible();
});
test("backup exporta notas e importa cópias como rascunhos", async ({
  page,
}) => {
  await manager(page);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar backup" }).click();
  const file = await download;
  const path = await file.path();
  expect(path).toBeTruthy();
  await page.locator("[data-import-file]").setInputFiles(path!);
  await expect(page.locator("#demo-toast")).toContainText(
    "6 notícia(s) importadas",
  );
  await expect(page.locator(".hn-manager-row")).toHaveCount(12);
  await page.locator("[data-filter]").selectOption("draft");
  await expect(page.locator(".hn-manager-row")).toHaveCount(7);
});
test("portal mobile não vaza horizontalmente", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".hn-lead h1")).toBeVisible();
  expect(
    await page
      .locator(".hn-portal")
      .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
  ).toBe(true);
  await manager(page);
  await page.locator('[data-action="create"]').first().click();
  expect(
    await page
      .locator(".hn-creator")
      .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
  ).toBe(true);
});

test("jogador e Íris veem só o jornal; ação oculta não abre o criador", async ({
  page,
}) => {
  await expect(page.locator('[data-mode="manager"]')).toBeHidden();
  await expect(page.locator("[data-reset]")).toBeHidden();
  await expect(
    page.locator(
      '[data-action="create"], [data-edit], [data-publish], [name="notes"]',
    ),
  ).toHaveCount(0);
  await page
    .locator('[data-mode="manager"]')
    .evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator("#demo-toast")).toContainText(
    "exclusivas do mestre",
  );
  await expect(page.locator(".hn-portal")).toBeVisible();
  await page.locator("#demo-reader").selectOption("iris");
  await expect(page.locator('[data-mode="manager"]')).toBeHidden();
  await expect(page.locator(".hn-portal")).toContainText("Arquivo restrito");
});
test("troca de mestre para jogador fecha edição e salva o rascunho separado", async ({
  page,
}) => {
  await editLead(page);
  await page.locator('[name="title"]').fill("Revisão privada antes da troca");
  await page.locator("#demo-reader").selectOption("player");
  await expect(page.locator(".hn-creator")).toHaveCount(0);
  await expect(page.locator('[data-mode="manager"]')).toBeHidden();
  await expect(page.locator(".hn-lead h1")).toContainText("Meridian volta");
  await editLead(page);
  await expect(page.locator('[name="title"]')).toHaveValue(
    "Revisão privada antes da troca",
  );
});
test("motion tem entrada e termina sem animações eternas", async ({ page }) => {
  await page.reload();
  await expect
    .poll(() =>
      page
        .locator("#demo")
        .evaluate((root) => root.getAnimations({ subtree: true }).length),
    )
    .toBeGreaterThan(0);
  await expect
    .poll(() =>
      page
        .locator("#demo")
        .evaluate(
          (root) =>
            root
              .getAnimations({ subtree: true })
              .filter((a) => a.playState === "running").length,
        ),
    )
    .toBe(0);
  await page.locator('[data-open="demo000000000000"]').first().click();
  await expect(page.locator(".hn-article")).toBeVisible();
  await expect(page.locator(".hn-portal")).toHaveAttribute("data-reading", "");
  await expect(page.locator(".hn-reading-progress")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator("#demo")
        .evaluate(
          (root) =>
            root
              .getAnimations({ subtree: true })
              .filter((a) => a.playState === "running").length,
        ),
    )
    .toBe(0);
});
test("preferência do sistema e opção do usuário reduzem motion em ambos os lados", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator("#demo")).toHaveClass(/hn-motion-reduced/);
  expect(
    await page
      .locator("#demo")
      .evaluate((root) => root.getAnimations({ subtree: true }).length),
  ).toBe(0);
  await manager(page);
  await page.locator('[data-action="create"]').first().click();
  expect(
    await page
      .locator("#demo")
      .evaluate((root) => root.getAnimations({ subtree: true }).length),
  ).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator("#demo-reduce-motion").check();
  await page
    .getByRole("textbox", { name: "Texto da notícia" })
    .fill("Texto com motion reduzido");
  await expect(page.locator("[data-live-preview]")).toContainText(
    "Texto com motion reduzido",
  );
  await expect(page.locator("[data-save-state]")).toHaveText("Rascunho salvo");
  expect(
    await page
      .locator("#demo")
      .evaluate((root) => root.getAnimations({ subtree: true }).length),
  ).toBe(0);
});
test("seções do criador abrem/fecham rapidamente sem perder campos", async ({
  page,
}) => {
  await editLead(page);
  const details = page
    .locator(".hn-options")
    .filter({ hasText: "Autoria e assuntos" });
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
  await page.locator('[name="author"]').fill("Correspondente nova");
  await details.locator("summary").click();
  await details.locator("summary").click();
  await expect(page.locator('[name="author"]')).toBeVisible();
  await expect(page.locator('[name="author"]')).toHaveValue(
    "Correspondente nova",
  );
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.locator("[data-save-state]")).toHaveText("Rascunho salvo");
});
