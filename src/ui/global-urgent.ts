import type { Article } from '../domain/model';
import { NewsEffects } from './news-effects';
import { applyAppearance, appearance, type Appearance } from './preferences';

/** One screen-wide urgent transmission. It persists until opened or dismissed. */
export class GlobalUrgentAlert {
  private root?: HTMLElement;
  private scene?: NewsEffects;
  constructor(private readonly open:(id:string)=>Promise<unknown>, private readonly preferences:()=>Appearance=appearance) {}
  show(article:Article, allowed:()=>boolean=()=>true):void {
    this.close();
    if(!allowed()) return;
    const root=document.createElement('section');root.className='hn-urgent-overlay';root.setAttribute('aria-label','Transmissão urgente');
    // User content is assigned only through textContent below.
    root.innerHTML='<div class="hn-urgent-field" aria-hidden="true"><i></i><i></i><span></span></div><article class="hn-urgent-panel"><div class="hn-urgent-corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div><header><span class="hn-urgent-network">REDE CIVIL / TRANSMISSÃO GLOBAL</span><button type="button" data-urgent-close aria-label="Dispensar alerta urgente">Dispensar <span aria-hidden="true">×</span></button></header><div class="hn-urgent-message" tabindex="0" role="alert" aria-live="assertive" aria-atomic="true"><div class="hn-urgent-emblem" aria-hidden="true"><i></i><i></i><svg viewBox="0 0 96 86"><path d="M48 5 91 79H5Z"/><path d="M48 29v23"/><circle cx="48" cy="64" r="2"/></svg></div><div class="hn-urgent-copy"><span class="hn-urgent-kicker">NOTÍCIA URGENTE</span><h2></h2><p></p></div></div><footer><span>Comunicado da redação</span><button type="button" data-urgent-read>Abrir notícia <span aria-hidden="true">↗</span></button></footer><span class="hn-urgent-rule" aria-hidden="true"></span></article>';
    root.querySelector('h2')!.textContent=article.title;
    const summary=root.querySelector('p')!;summary.textContent=article.summary;summary.hidden=!article.summary;
    root.querySelector('[data-urgent-close]')!.addEventListener('click',()=>this.close());
    root.querySelector('[data-urgent-read]')!.addEventListener('click',()=>{const readable=allowed();this.close();if(readable) void this.open(article.id).catch(console.error);});
    applyAppearance(root,this.preferences());document.body.append(root);this.root=root;this.scene=new NewsEffects();this.scene.urgent(root.querySelector('.hn-urgent-panel')!);
  }
  preferenceChanged():void {if(this.root)applyAppearance(this.root,this.preferences());this.scene?.preferenceChanged();}
  close():void {this.scene?.dispose();this.scene=undefined;this.root?.remove();this.root=undefined;}
}
