/** Decorative broadcast diagrams. No news text, interactive controls or document-wide effects. */
const SVG_OPEN = '<svg viewBox="0 0 520 220" fill="none" aria-hidden="true" focusable="false">';
const GRAPHICS: Record<string,string> = {
  orbital: SVG_OPEN + '<g class="hn-sci-orbits"><ellipse cx="334" cy="110" rx="161" ry="65" transform="rotate(-24 334 110)"/><ellipse cx="334" cy="110" rx="120" ry="91" transform="rotate(30 334 110)"/><circle cx="334" cy="110" r="58"/><circle cx="334" cy="110" r="37" stroke-dasharray="2 7"/></g><g class="hn-sci-routes"><path d="M30 174H124L166 132H221M366 60H426L473 13M373 166H466V202"/><path d="M334 30V46M334 174V190M254 110H270M398 110H414"/></g><g class="hn-sci-nodes"><circle cx="166" cy="132" r="4"/><circle cx="426" cy="60" r="4"/><circle cx="373" cy="166" r="4"/><circle cx="334" cy="110" r="5"/></g><g class="hn-sci-ticks"><path d="M46 191v9m8-9v9m8-9v9m8-9v9m8-9v9m8-9v9m8-9v9m8-9v9M474 91h17m-17 9h10m-10 9h17m-17 9h10"/></g></svg>',
  pulsar: SVG_OPEN + '<g class="hn-sci-orbits"><path d="M15 132H43L57 114L71 132H90L103 91L115 151L130 107L145 133H174L190 60L205 170L220 110L232 132H271L285 115L298 136H344L361 79L376 155L390 121L402 132H507"/><path d="M15 151H507M15 170H507M15 189H507" stroke-dasharray="2 7"/><circle cx="329" cy="75" r="47"/><circle cx="329" cy="75" r="31" stroke-dasharray="4 6"/></g><g class="hn-sci-routes"><path d="M25 29H190L214 53H267M382 54H478V97M284 202H459"/></g><g class="hn-sci-nodes"><circle cx="25" cy="29" r="4"/><circle cx="267" cy="53" r="4"/><circle cx="478" cy="97" r="4"/></g><g class="hn-sci-packets"><path d="M41 207v-8m12 8v-18m12 18v-30m12 30v-15m12 15v-41m12 41v-25m12 25v-10m12 10v-33m12 33v-48m12 48v-20m12 20v-35m12 35v-15m12 15v-7"/></g></svg>',
  nexo: SVG_OPEN + '<g class="hn-sci-routes"><path d="M20 44H108L154 90H241L285 134H376L419 91H499M38 172H144L185 131H258L303 86H389L435 40H488M108 44V172M376 134V190H482M285 134V192H215M303 86V24H240"/></g><g class="hn-sci-orbits"><path d="M210 73l30-17 30 17v35l-30 17-30-17zM366 27l20-12 21 12v24l-21 12-20-12zM124 151l20-12 20 12v24l-20 12-20-12z"/></g><g class="hn-sci-nodes"><circle cx="108" cy="44" r="5"/><circle cx="241" cy="90" r="5"/><circle cx="285" cy="134" r="5"/><circle cx="419" cy="91" r="5"/><circle cx="185" cy="131" r="5"/><circle cx="303" cy="86" r="5"/><circle cx="376" cy="190" r="5"/></g><g class="hn-sci-ticks"><path d="M454 153h28m-28 8h20m-20 8h28m-28 8h12M30 98h22m-22 8h12m-12 8h22"/></g></svg>',
};
export class SciFiScenes {
  private nodes = new Set<HTMLElement>();
  private effects = new Set<Animation>();
  private root?: HTMLElement;
  private theme = "";
  mount(root: HTMLElement, animate = true, force = false): void {
    const theme = root.closest<HTMLElement>("[data-hn-theme]")?.dataset.hnTheme ?? "";
    if (!force && this.root === root && this.theme === theme && [...this.nodes].some(n=>root.contains(n))) return;
    this.dispose(); this.root = root; this.theme = theme;
    if (!GRAPHICS[theme]) return;
    const masthead = root.querySelector<HTMLElement>(".hn-masthead");
    if (masthead) {
      const diagram = this.add(masthead,"hn-sci-diagram"); diagram.innerHTML = GRAPHICS[theme];
      const rail = this.add(masthead,"hn-sci-rail");
      for(let i=0;i<12;i++) { const tick=document.createElement("i"); tick.style.setProperty("--segment",String(i));rail.append(tick); }
      if(animate) {
        diagram.querySelectorAll<SVGGeometryElement>(".hn-sci-routes path,.hn-sci-orbits>*").forEach((line,i)=>{
          const length=line.getTotalLength();
          this.play(line,[{strokeDasharray:`${length} ${length}`,strokeDashoffset:length,opacity:.1},{strokeDasharray:`${length} ${length}`,strokeDashoffset:0,opacity:1}],700,Math.min(i*55,180));
        });
        diagram.querySelectorAll(".hn-sci-nodes circle").forEach((node,i)=>this.play(node,[{opacity:.15,transform:"scale(.7)"},{opacity:1,transform:"scale(1.2)",offset:.65},{opacity:1,transform:"none"}],450,180+i*30));
        diagram.querySelectorAll(".hn-sci-packets").forEach(node=>this.play(node,[{transform:"scaleY(.2)",opacity:.1},{transform:"scaleY(1.15)",opacity:1,offset:.65},{transform:"scaleY(1)",opacity:1}],650,120));
        rail.querySelectorAll("i").forEach((node,i)=>this.play(node,[{transform:"scaleY(.25)",opacity:.25},{transform:"scaleY(1)",opacity:1,offset:.65},{transform:"scaleY(1)",opacity:.65}],380,i*25));
      }
    }
    root.querySelectorAll<HTMLElement>(".hn-lead-image,.hn-card-image,.hn-article>figure").forEach(picture=>{
      const frame=this.add(picture,"hn-sci-frame");
      frame.innerHTML='<i></i><i></i><i></i><i></i><span class="hn-sci-sweep"></span>';
      if(animate && picture.getBoundingClientRect().top < innerHeight && picture.getBoundingClientRect().bottom > 0)
        this.picture(frame);
    });
    root.querySelectorAll<HTMLElement>(".hn-card").forEach((card,i)=>{
      const code=this.add(card,"hn-sci-index");code.textContent=String(i+1).padStart(2,"0");
    });
    const header=root.querySelector<HTMLElement>(".hn-article>header");
    if(header){const ruler=this.add(header,"hn-sci-ruler");ruler.innerHTML='<i></i><i></i><i></i><i></i><i></i><i></i>';}
  }
  private add(parent: HTMLElement, className: string): HTMLElement {
    const node=document.createElement("span");node.className=className;node.setAttribute("aria-hidden","true");parent.append(node);this.nodes.add(node);return node;
  }
  private play(node: Element, frames: Keyframe[], duration: number, delay=0): void {
    if(!this.root || this.root.closest(".hn-no-motion") || this.root.classList.contains("hn-no-motion") || this.root.closest<HTMLElement>("[data-hn-motion]")?.dataset.hnMotion !== "full" || matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden || typeof node.animate!=="function") return;
    const effect=node.animate(frames,{duration,delay,easing:"cubic-bezier(.22,1,.36,1)",fill:"backwards"});this.effects.add(effect);
    void effect.finished.then(()=>{this.effects.delete(effect);effect.cancel();},()=>this.effects.delete(effect));
  }
  private picture(frame: HTMLElement): void {
    frame.querySelectorAll("i").forEach((corner,i)=>this.play(corner,[{opacity:.1,transform:"scale(.6)"},{opacity:1,transform:"none"}],380,i*40));
    const sweep=frame.querySelector(".hn-sci-sweep")!;
    if(this.theme==="orbital") this.play(sweep,[{transform:"translateX(-110%)",opacity:0},{opacity:.7,offset:.2},{transform:"translateX(520%)",opacity:0}],850);
    if(this.theme==="pulsar") this.play(sweep,[{transform:"translateY(-110%)",opacity:0},{opacity:.5,offset:.2},{transform:"translateY(650%)",opacity:0}],800);
    if(this.theme==="nexo") this.play(sweep,[{transform:"scaleX(0)",opacity:0},{transform:"scaleX(1)",opacity:.75,offset:.65},{transform:"scaleX(1)",opacity:0}],650);
  }
  card(card: HTMLElement): void { const frame=card.querySelector<HTMLElement>(".hn-sci-frame"); if(frame)this.picture(frame); }
  stop(): void { for(const effect of this.effects)effect.cancel();this.effects.clear(); }
  dispose(): void { this.stop();for(const node of this.nodes)node.remove();this.nodes.clear();this.root=undefined;this.theme=""; }
}
