import { test, expect } from '@playwright/test';
const themes=['gazeta','obsidiana','aurora','terminal','dossie','orbital','pulsar','nexo'];
for(const theme of themes) test(`${theme}: contraste, fontes locais, texto ampliado e composição sem sobreposição`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('/preview/');await page.locator('#demo-reduce-motion').check();
 await page.locator('[data-appearance]').click();await page.locator(`[data-theme-choice=${theme}]`).click();await page.locator('.demo-close-appearance').click();await page.evaluate(()=>document.fonts.ready);
 const contrast=await page.locator('.hsn-window').first().evaluate(root=>{
  const s=getComputedStyle(root),get=(name:string)=>s.getPropertyValue('--'+name).trim();const cv=document.createElement('canvas');cv.width=cv.height=1;const cx=cv.getContext('2d')!;
  const rgb=(c:string)=>{cx.fillStyle=c;cx.fillRect(0,0,1,1);return [...cx.getImageData(0,0,1,1).data].slice(0,3)};
  const l=(c:string)=>rgb(c).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i]!,0);
  const ratio=(a:string,b:string)=>{const x=l(a),y=l(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  const pairs=[['body','paper'],['body','surface'],['muted','surface'],['muted','paper'],['ink','field'],['accent','surface'],['on-accent','accent'],['on-accent','cyan']] as const;
  const text=pairs.map(([a,b])=>({pair:a+'/'+b,ratio:ratio(get(a),get(b))}));
  const fields=['surface','field'].map(bg=>ratio(get('control-border'),get(bg)));
  const stops=get('brand-gradient').match(/#[0-9a-f]{6}/gi)!;const gradient:number[]=[];
  for(let i=1;i<stops.length;i++){const a=rgb(stops[i-1]!),b=rgb(stops[i]!);for(let t=0;t<=10;t++)gradient.push(ratio(get('on-accent'),`rgb(${a.map((v,j)=>v+(b[j]!-v)*t/10).join(',')})`));}
  const heading=getComputedStyle(root.querySelector('.hn-lead h1')!);const font=heading.fontFamily.split(',')[0]!;
  const computed=[...root.querySelectorAll('.hn-lead h1,.hn-lead p,.hn-card h3,.hn-card p,.hn-categories button,.hn-search input,.hn-network,.hn-lead button')].filter(e=>e.getBoundingClientRect().width>0).map(e=>{
   const foreground=getComputedStyle(e).color;let n:Element|null=e,background='';
   while(n){const style=getComputedStyle(n);if(style.backgroundImage!=='none')return null;if(style.backgroundColor!=='rgba(0, 0, 0, 0)'&&style.backgroundColor!=='transparent'){background=style.backgroundColor;break;}n=n.parentElement;}
   return background?{element:e.tagName,text:e.textContent?.slice(0,35)??'',ratio:ratio(foreground,background)}:null;
  }).filter((v):v is {element:string,text:string,ratio:number}=>v!==null);
  return {text,fields,gradient,computed,loaded:document.fonts.check(`${heading.fontWeight} 24px ${font}`),family:font};
 });
 for(const c of contrast.text)expect(c.ratio,`${theme} ${c.pair}`).toBeGreaterThanOrEqual(4.5);
 for(const c of contrast.computed)expect(c.ratio,`${theme} computed ${c.element} ${c.text}`).toBeGreaterThanOrEqual(4.5);
 for(const ratio of contrast.fields)expect(ratio).toBeGreaterThanOrEqual(3);
 expect(Math.min(...contrast.gradient)).toBeGreaterThanOrEqual(4.5);expect(contrast.loaded).toBe(true);expect(contrast.family).toContain('HN ');
 // Headline and picture may share a panel edge, but readable text never crosses onto the photo.
 const overlap=await page.locator('.hn-lead').evaluate(e=>{const a=e.querySelector('h1')!.getBoundingClientRect(),b=e.querySelector('.hn-lead-image')!.getBoundingClientRect();return Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top))});expect(overlap).toBe(0);
 await page.locator('[data-appearance]').click();await page.locator('[name=fontScale]').fill('1.4');await page.locator('[name=fontScale]').dispatchEvent('input');await page.locator('.demo-close-appearance').click();
 await page.locator('.hn-lead [data-open]').first().click();await expect(page.locator('.hn-article-body')).toContainText('06h14');
 for(const width of [760,390]){await page.setViewportSize({width,height:900});expect(await page.locator('.hn-portal').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);}
 await page.locator('[data-back]').click();await page.locator('.hn-card').first().scrollIntoViewIfNeeded();expect(await page.locator('.hn-portal').evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
 expect(errors).toEqual([]);
});

test('oito identidades diferem também na estrutura e preservam o editor Foundry',async({page})=>{
 await page.goto('/preview/');await page.locator('#demo-reduce-motion').check();const signatures:string[]=[];
 for(const theme of themes){await page.locator('[data-appearance]').click();await page.locator(`[data-theme-choice=${theme}]`).click();await page.locator('.demo-close-appearance').click();await page.evaluate(()=>document.fonts.ready);
 signatures.push(await page.locator('.hn-portal').evaluate(e=>JSON.stringify(['.hn-brand strong','.hn-lead','.hn-lead-text','.hn-lead-image','.hn-grid','.hn-card h3'].map(sel=>{const n=e.querySelector(sel)!,s=getComputedStyle(n);return [s.fontFamily,s.fontStyle,s.fontWeight,s.fontSize,s.display,s.gridTemplateColumns,s.borderRadius,s.padding,s.height]}))));}
 expect(new Set(signatures).size).toBe(8);
 await page.goto('/tests/fixtures/foundry-runtime.html');await page.waitForFunction(()=>!!(window as any).fixture);await page.locator('prose-mirror').evaluate(e=>(window as any).themeOriginal=e);const before=await page.locator('prose-mirror').evaluate((e:any)=>e.value);
 for(const theme of themes){await page.evaluate(async theme=>{await (window as any).game.settings.set('holosuite-news','theme',theme)},theme);expect(await page.locator('prose-mirror').evaluate(e=>e===(window as any).themeOriginal)).toBe(true);expect(await page.locator('prose-mirror').evaluate((e:any)=>e.value)).toBe(before);}
});
