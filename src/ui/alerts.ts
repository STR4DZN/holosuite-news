import { MODULE_ID } from "../constants";
import { canRead, type Article } from "../domain/model";
import { PRIORITIES, validateNewsMotion } from "../domain/news-motion";
import { validateArticle } from "../domain/validation";
import { NewsEffects } from "./news-effects";
import { GlobalUrgentAlert } from "./global-urgent";
import { applyAppearance } from "./preferences";

export function alertElement(article: Article, read: () => void, close: () => void): HTMLElement {
  const profile = validateNewsMotion(article.motion, article.urgent), notice = document.createElement("section");
  notice.className = "hn-publication-alert"; notice.dataset.style = profile.alert; notice.dataset.priority = profile.priority;
  notice.setAttribute("role", "status"); notice.setAttribute("aria-label", `${PRIORITIES[profile.priority]}: ${article.title}`);
  // Only fixed markup enters innerHTML; titles and descriptions always use textContent.
  notice.innerHTML = '<div class="hn-alert-emblem" aria-hidden="true"><span></span><span></span><b>!</b></div><div class="hn-alert-content"><span class="hn-alert-kicker"></span><h3></h3><p></p><button type="button" data-alert-read>Ler notícia</button></div><button type="button" class="hn-alert-close" data-alert-close aria-label="Dispensar alerta">Fechar</button><span class="hn-alert-rule" aria-hidden="true"></span>';
  notice.querySelector(".hn-alert-kicker")!.textContent = PRIORITIES[profile.priority].toUpperCase();
  notice.querySelector("h3")!.textContent = article.title || "Sua próxima notícia";
  notice.querySelector("p")!.textContent = profile.priority === "urgent" ? "Uma atualização muito urgente chegou à rede civil." : profile.priority === "important" ? "Uma atualização importante chegou à rede civil." : "Uma nova notícia chegou à rede civil.";
  notice.querySelector("[data-alert-read]")!.addEventListener("click", read);
  notice.querySelector("[data-alert-close]")!.addEventListener("click", close);
  return notice;
}

export class PublicationAlerts {
  private known = new Map<string, string>();
  private visible = new Map<string, { root: HTMLElement; scene: NewsEffects; doc: any }>();
  private stack?: HTMLElement;
  private knownBroadcasts = new Map<string,string>();
  private global: GlobalUrgentAlert;
  private globalDoc?: any;
  constructor(private readonly open: (id: string) => Promise<unknown>) { this.global=new GlobalUrgentAlert(open); }
  private broadcast(doc:any,article:Article): string | null {
    const event=doc.getFlag(MODULE_ID,"urgentBroadcast");
    return article.urgent && article.audience.mode==="all" && typeof event?.id==="string" && event.id.length>0 && event.id.length<=100 && Number.isSafeInteger(event.sentAt) && event.sentAt>0 && Date.now()-event.sentAt<300_000 && event.sentAt<=Date.now()+60_000 ? event.id : null;
  }
  private article(doc: any): Article | null {
    if (doc.pack || doc.getFlag(MODULE_ID, "kind") !== "article") return null;
    try {
      const article = validateArticle(doc.getFlag(MODULE_ID, "article"), true);
      return canRead(article, game.user) && (game.user.isGM || doc.testUserPermission(game.user, "OBSERVER")) ? article : null;
    } catch { return null; }
  }
  prime(docs: Iterable<any>): void {
    for (const doc of docs) { const article = this.article(doc); if (article) {this.known.set(article.id, JSON.stringify(article));const event=this.broadcast(doc,article);if(event)this.knownBroadcasts.set(article.id,event);} }
  }
  observe(doc: any, userId?: string): void {
    const id = doc.getFlag(MODULE_ID, "article")?.id;
    const article = this.article(doc);
    if (!article) { if (id) this.dismiss(id);if(this.globalDoc?.id===doc.id){this.global.close();this.globalDoc=undefined;}return; }
    if(this.globalDoc && (this.globalDoc===doc || this.globalDoc.id===doc.id) && (!article.urgent || article.audience.mode!=='all')) {this.global.close();this.globalDoc=undefined;}
    const fingerprint = JSON.stringify(article);
    const event=this.broadcast(doc,article);
    const trustedSender=[...(game.users??[])].some((user:any)=>user.id===userId && user.isGM);
    if(event && trustedSender && this.knownBroadcasts.get(article.id)!==event) {
      this.knownBroadcasts.set(article.id,event);this.known.set(article.id,fingerprint);this.dismiss(article.id);this.globalDoc=doc;
      this.global.show(article,()=>{const current=this.article(doc);return !!current && current.urgent && current.audience.mode==='all';});return;
    }
    if (this.known.get(article.id) === fingerprint) return;
    this.known.set(article.id, fingerprint);
    this.dismiss(article.id);
    const profile = validateNewsMotion(article.motion, article.urgent);
    if (article.notify === false || profile.alert === "none") return;
    if (!this.stack) { this.stack = document.createElement("div"); this.stack.className = "hn-broadcast-stack"; this.stack.setAttribute("aria-label", "Notícias recém-publicadas"); document.body.append(this.stack); }
    while (this.visible.size >= 3) this.dismiss(this.visible.keys().next().value!);
    const root = document.createElement("div"), scene = new NewsEffects();
    root.className = "hsn-window hn-notification-window"; applyAppearance(root);
    const notice = alertElement(article, () => { this.dismiss(article.id); if (this.article(doc)) void this.open(article.id).catch(console.error); }, () => this.dismiss(article.id));
    root.append(notice); this.stack.append(root); this.visible.set(article.id, { root, scene, doc }); scene.alert(notice, profile);
  }
  remove(doc: any): void { const id = doc.getFlag(MODULE_ID, "article")?.id; if (id) { this.known.delete(id); this.knownBroadcasts.delete(id);this.dismiss(id);if(this.globalDoc===doc || this.globalDoc?.id===doc.id){this.global.close();this.globalDoc=undefined;} } }
  dismiss(id: string): void {
    const item = this.visible.get(id); if (!item) return;
    item.scene.dispose(); item.root.remove(); this.visible.delete(id);
    if (!this.visible.size) { this.stack?.remove(); this.stack = undefined; }
  }
  appearanceChanged(): void { this.global.preferenceChanged();for (const { root, scene } of this.visible.values()) { applyAppearance(root); scene.preferenceChanged(); } }
  permissionsChanged(): void { if(this.globalDoc && !this.article(this.globalDoc)){this.global.close();this.globalDoc=undefined;}for (const [id, item] of this.visible) if (!this.article(item.doc)) this.dismiss(id); }
}
