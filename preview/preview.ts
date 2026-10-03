import Handlebars from "handlebars";
import "../styles/index.css";
import "./preview.css";
import portalTemplate from "../templates/reader/portal.hbs?raw";
import managerTemplate from "../templates/gm/manager.hbs?raw";
import editorTemplate from "../templates/gm/editor.hbs?raw";
import articleTemplate from "../templates/reader/article.hbs?raw";
import { registerHelpers } from "../src/settings";
import { Newsroom } from "../src/core/newsroom";
import { MemoryNewsStore } from "../src/storage/memory-store";
import { newItem, canRead } from "../src/domain/model";
import { validateItem } from "../src/domain/validation";
import {
  portalContext,
  managerContext,
  editorContext,
  type PortalRoute,
} from "../src/ui/context";
import { bindPortal } from "../src/ui/portal";
import { EditorSession } from "../src/ui/editor";
import { MotionScene } from "../src/ui/motion";
import skyline from "../assets/meridian.svg";
import orbital from "../assets/preview-landscape.svg";
import transit from "../assets/transit.svg";
import cargo from "../assets/cargo.svg";

registerHelpers(Handlebars);
Handlebars.registerPartial(
  "modules/holosuite-news/dist/templates/reader/article.hbs",
  articleTemplate,
);
const templates = {
  portal: Handlebars.compile(portalTemplate),
  manager: Handlebars.compile(managerTemplate),
  editor: Handlebars.compile(editorTemplate),
  article: Handlebars.compile(articleTemplate),
};
const demoAssets: Record<string, string> = {
  "demo/meridian.svg": skyline,
  "demo/orbital.svg": orbital,
  "demo/transit.svg": transit,
  "demo/cargo.svg": cargo,
};
function withCover(context: any): any {
  return context
    ? { ...context, cover: demoAssets[context.cover] ?? context.cover }
    : context;
}
(globalThis as any).TextEditor = { enrichHTML: async (value: string) => value };
class DemoRichText extends HTMLElement {
  private content?: HTMLDivElement;
  private initial = "";
  get value(): string {
    return this.content?.innerHTML ?? this.initial;
  }
  set value(value: string) {
    this.initial = value;
    if (this.content) this.content.innerHTML = value;
  }
  connectedCallback(): void {
    this.innerHTML =
      '<div class="demo-rich-toolbar"><button type="button" data-command="bold"><b>B</b></button><button type="button" data-command="italic"><i>I</i></button><button type="button" data-block="h2">Título</button><button type="button" data-block="blockquote">Citação</button><button type="button" data-command="insertUnorderedList">Lista</button></div><div class="demo-editable" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Texto da notícia"></div>';
    this.content = this.querySelector<HTMLDivElement>(".demo-editable")!;
    this.content.innerHTML = this.initial;
    this.querySelectorAll<HTMLButtonElement>("button").forEach((button) =>
      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
        this.content!.focus();
        document.execCommand(
          button.dataset.command ?? "formatBlock",
          false,
          button.dataset.block,
        );
        this.dispatchEvent(new Event("input", { bubbles: true }));
      }),
    );
  }
}
customElements.define("prose-mirror", DemoRichText);

const store = new MemoryNewsStore();
const DEMO_STORAGE_KEY = "holonews-prisma-v2-2";
const root = document.querySelector<HTMLElement>("#demo")!;
const scene = new MotionScene();
function assertDemoGM(): void {
  if (reader !== "gm")
    throw new Error("Edição e administração são exclusivas do mestre.");
}
let mode: "portal" | "manager" | "editor" = "portal",
  reader = "player",
  query = "",
  filter = "all";
let session: EditorSession | undefined;
let renderGeneration = 0;
const route: PortalRoute = { query: "", category: "", page: 1 };
const newsroom = new Newsroom(
  store,
  assertDemoGM,
  () => crypto.randomUUID().replaceAll("-", "").slice(0, 16),
  persist,
);
function persist(): void {
  localStorage.setItem(
    DEMO_STORAGE_KEY,
    JSON.stringify([...store.items.values()]),
  );
}
function toast(message: string): void {
  const node = document.querySelector<HTMLElement>("#demo-toast")!;
  node.textContent = message;
  node.style.display = "block";
  setTimeout(() => {
    node.style.display = "none";
  }, 4000);
}
function error(value: unknown): void {
  toast(value instanceof Error ? value.message : String(value));
}
function seed(): void {
  const data = [
    {
      title: "Meridian volta a receber luz depois de nove dias de silêncio",
      summary:
        "A rede civil foi restabelecida nesta manhã. O Conselho ainda não explicou o sinal encontrado nos repetidores do setor norte.",
      category: "Meridian",
      cover: "demo/meridian.svg",
      coverAlt: "Bairro central de Meridian diante dos anéis do planeta.",
      featured: true,
      views: 128430,
      author: "Lia Voss",
      date: "24.08.2186 · 09:40",
      body: "<p>Às 06h14, as janelas do distrito central voltaram a acender. Pela primeira vez em nove dias, os moradores de Meridian puderam ouvir o boletim da rede civil sem interferência.</p><p>A Companhia de Infraestrutura atribuiu o apagão a uma falha nos repetidores do setor norte. Equipes independentes, porém, encontraram um segundo sinal entre os registros de manutenção.</p><blockquote>“A energia voltou. A pergunta agora é quem estava usando a nossa rede enquanto ela estava desligada.”</blockquote><h2>O que muda para os moradores</h2><p>O transporte coletivo retoma as rotas habituais nesta tarde. Hospitais e centros de abastecimento terão prioridade durante as próximas 48 horas.</p>",
      tags: ["Meridian", "rede civil", "apagão"],
    },
    {
      title: "Estação Nove detecta uma nave que não consta em nenhum registro",
      summary:
        "O objeto permaneceu seis minutos na órbita externa e desapareceu antes da chegada da patrulha.",
      category: "Fronteira",
      cover: "demo/orbital.svg",
      coverAlt: "Estação orbital sobre a superfície de um planeta.",
      views: 48217,
      date: "24.08.2186 · 08:12",
      urgent: true,
    },
    {
      title: "Linha leste reabre com novas paradas no cinturão industrial",
      summary:
        "O primeiro comboio já deixou a plataforma central. A tarifa continua a mesma.",
      category: "Cotidiano",
      cover: "demo/transit.svg",
      coverAlt: "Comboio civil cruza o cinturão industrial.",
      views: 12804,
      date: "23.08.2186 · 17:05",
    },
    {
      title: "O mercado dos anéis: o que está por trás da alta dos suprimentos",
      summary:
        "Comerciantes falam em escassez. Trabalhadores do porto contam outra história.",
      category: "Economia",
      cover: "demo/cargo.svg",
      coverAlt: "Contêineres junto ao porto orbital.",
      views: 34921,
      date: "23.08.2186 · 11:30",
    },
    {
      title: "Arquivo restrito: a frequência sob o apagão",
      summary: "Relatório reservado à equipe de investigação.",
      category: "Investigação",
      views: 12,
      audience: { mode: "selected" as const, users: ["iris"] },
    },
  ];
  store.items.clear();
  store.articles.clear();
  data.forEach((value, index) => {
    const item = newItem(`demo${String(index).padStart(12, "0")}`);
    item.draft = {
      ...item.draft,
      author: "Redação HoloNews",
      date: "24.08.2186",
      body: "<p>Esta notícia faz parte dos dados de demonstração. Abra o criador para escrever sua própria história.</p>",
      ...value,
    };
    item.notes =
      "Gancho: os registros oficiais foram alterados. A testemunha do porto sabe quem entrou na estação.";
    item.published = structuredClone(item.draft);
    item.publishedAt = Date.now() - index * 3600000;
    store.items.set(item.id, item);
    store.articles.set(item.id, item.published);
  });
  const draft = newItem("demodraft00000000");
  draft.draft.title = "O relato que ainda não pode ir ao ar";
  draft.draft.summary = "Uma testemunha decidiu falar.";
  draft.notes = "A fonte precisa de proteção.";
  store.items.set(draft.id, draft);
  persist();
}
try {
  const saved = localStorage.getItem(DEMO_STORAGE_KEY);
  if (!saved) seed();
  else
    for (const value of JSON.parse(saved)) {
      const item = validateItem(value);
      store.items.set(item.id, item);
      if (item.published) store.articles.set(item.id, item.published);
    }
} catch {
  seed();
}
async function edit(id: string): Promise<void> {
  assertDemoGM();
  const item = await newsroom.get(id);
  assertDemoGM();
  mode = "editor";
  session = new EditorSession(
    item,
    newsroom,
    {
      preview: async (context) => templates.article(withCover(context)),
      confirm: async (_title, text) => confirm(text),
      error,
      changed: persist,
      pickImage: async (current) => prompt("Caminho ou URL da imagem", current),
    },
    scene,
  );
  await render();
}
async function render(): Promise<void> {
  if (reader !== "gm" && mode !== "portal") {
    session?.dispose();
    session = undefined;
    mode = "portal";
  }
  const generation = ++renderGeneration;
  document.querySelector<HTMLElement>('[data-mode="manager"]')!.hidden =
    reader !== "gm";
  document.querySelector<HTMLElement>("[data-reset]")!.hidden = reader !== "gm";
  root.classList.toggle(
    "hn-no-motion",
    document.querySelector<HTMLInputElement>("#demo-reduce-motion")!.checked,
  );
  document
    .querySelectorAll<HTMLElement>("[data-mode]")
    .forEach((button) =>
      button.classList.toggle(
        "is-active",
        button.dataset.mode === (mode === "editor" ? "manager" : mode),
      ),
    );
  if (mode === "portal") {
    const articles = (await store.publicArticles()).filter((a) =>
      canRead(a, { id: reader, isGM: reader === "gm" }),
    );
    const context = await portalContext(
      articles,
      {
        name: "HoloNews",
        tagline: "O seu mundo. Em transmissão.",
        location: "Rede civil de Meridian",
      },
      route,
    );
    if (generation !== renderGeneration) return;
    root.innerHTML = templates.portal({
      ...context,
      lead: withCover(context.lead),
      cards: (context.cards as any[]).map(withCover),
      article: withCover(context.article),
      fontScale: 1,
    });
    scene.mount(root, "portal");
    bindPortal(root, route, () => void render().catch(error));
  } else if (mode === "manager") {
    assertDemoGM();
    const context = managerContext(await newsroom.list(), query, filter);
    if (generation !== renderGeneration || reader !== "gm") return;
    root.innerHTML = templates.manager({
      ...context,
      items: (context.items as any[]).map(withCover),
    });
    scene.mount(root, "manager");
    const run = (action: () => Promise<unknown>) =>
      void Promise.resolve()
        .then(() => {
          assertDemoGM();
          return action();
        })
        .catch(error);
    root
      .querySelectorAll<HTMLButtonElement>("[data-edit]")
      .forEach((b) => (b.onclick = () => run(() => edit(b.dataset.edit!))));
    root
      .querySelectorAll<HTMLButtonElement>('[data-action="create"]')
      .forEach(
        (b) =>
          (b.onclick = () =>
            run(async () => edit((await newsroom.create()).id))),
      );
    root
      .querySelectorAll<HTMLButtonElement>("[data-duplicate]")
      .forEach(
        (b) =>
          (b.onclick = () =>
            run(async () =>
              edit((await newsroom.duplicate(b.dataset.duplicate!)).id),
            )),
      );
    root.querySelectorAll<HTMLButtonElement>("[data-retry]").forEach(
      (b) =>
        (b.onclick = () =>
          run(async () => {
            await newsroom.retry(b.dataset.retry!);
            await render();
          })),
    );
    root.querySelectorAll<HTMLButtonElement>("[data-delete]").forEach(
      (b) =>
        (b.onclick = () =>
          run(async () => {
            if (!confirm("Excluir esta notícia e seu rascunho?")) return;
            const item = await newsroom.get(b.dataset.delete!);
            await newsroom.remove(item.id, item.revision);
            await render();
          })),
    );
    root.querySelector<HTMLButtonElement>('[data-action="portal"]')!.onclick =
      () => {
        mode = "portal";
        void render();
      };
    root
      .querySelector("[data-manager-search]")!
      .addEventListener("submit", (e) => {
        e.preventDefault();
        query = root.querySelector<HTMLInputElement>('[name="query"]')!.value;
        void render();
      });
    root.querySelector<HTMLSelectElement>("[data-filter]")!.onchange = (e) => {
      filter = (e.target as HTMLSelectElement).value;
      void render();
    };
    root.querySelector<HTMLButtonElement>('[data-action="export"]')!.onclick =
      () =>
        run(async () => {
          const url = URL.createObjectURL(
            new Blob([JSON.stringify(await newsroom.backup(), null, 2)], {
              type: "application/json",
            }),
          );
          const a = document.createElement("a");
          a.href = url;
          a.download = "holonews-backup.json";
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 500);
        });
    const upload = root.querySelector<HTMLInputElement>("[data-import-file]")!;
    root.querySelector<HTMLButtonElement>('[data-action="import"]')!.onclick =
      () => upload.click();
    upload.onchange = () =>
      run(async () => {
        const file = upload.files?.[0];
        if (!file) return;
        if (file.size > 32 * 1024 * 1024) throw new Error("Limite: 32 MB.");
        toast(
          `${await newsroom.importBackup(JSON.parse(await file.text()))} notícia(s) importadas como rascunhos.`,
        );
        await render();
      });
  } else if (session) {
    root.innerHTML = templates.editor(
      editorContext(
        session.item,
        [
          { id: "player", name: "Jogador" },
          { id: "iris", name: "Íris" },
        ],
        ["Meridian", "Fronteira", "Cotidiano", "Economia"],
      ),
    );
    const mount = root.querySelector("[data-rich-editor]")!;
    const rich = document.createElement("prose-mirror") as DemoRichText;
    rich.setAttribute("name", "body");
    rich.value = session.item.draft.body;
    mount.replaceChildren(rich);
    session.bind(root);
  }
}
document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach(
  (button) =>
    (button.onclick = () =>
      void (async () => {
        if (mode === "editor" && session && !(await session.beforeClose()))
          return;
        session = undefined;
        if (button.dataset.mode === "manager") assertDemoGM();
        mode = button.dataset.mode as "portal" | "manager";
        await render();
      })().catch(error)),
);
document.querySelector<HTMLSelectElement>("#demo-reader")!.onchange = (
  event,
) => {
  void (async () => {
    const next = (event.target as HTMLSelectElement).value;
    if (next === reader) return;
    if (mode === "editor" && session && !(await session.beforeClose())) {
      (event.target as HTMLSelectElement).value = reader;
      return;
    }
    session = undefined;
    reader = next;
    if (reader !== "gm") mode = "portal";
    scene.dispose();
    await render();
  })().catch(error);
};
document.querySelector<HTMLInputElement>("#demo-reduce-motion")!.onchange = (
  event,
) => {
  scene.setReduced((event.target as HTMLInputElement).checked);
};
document.querySelector<HTMLButtonElement>("[data-reset]")!.onclick = () => {
  if (reader !== "gm") {
    error(new Error("Apenas o mestre pode reiniciar os dados."));
    return;
  }
  if (confirm("Restaurar os dados de demonstração?")) {
    session?.dispose();
    session = undefined;
    scene.dispose();
    seed();
    mode = "portal";
    route.articleId = undefined;
    route.query = "";
    route.category = "";
    route.page = 1;
    void render();
  }
};
void render().catch(error);
