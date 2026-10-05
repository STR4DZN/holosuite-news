import { MODULE_ID, PRIVATE_PACK } from '../constants';
import { primaryGM } from './authority';
import type { WriteCommand } from '../core/commands';

interface Pending { target: string; resolve(value: unknown): void; reject(reason: unknown): void; timer: ReturnType<typeof setTimeout>; }
/** Commands travel through a GM-only document. Foundry supplies the authenticated modifying userId. */
export class GMWriteCoordinator {
  private pending = new Map<string, Pending>();
  private processing = new Set<string>();
  private hooks: Array<[string, number]> = [];
  constructor(
    private readonly execute: (command: WriteCommand, args: unknown[]) => Promise<unknown>,
    private readonly workspace: () => Promise<any>,
    private readonly context: () => any = () => game,
    private readonly create: (data: any, options: any) => Promise<any> = (data, options) => JournalEntry.create(data, options),
    private readonly timeout = 120_000,
    private readonly wakeDelay = 2000,
  ) {}
  listen(): void {
    if(this.hooks.length) return;
    for(const event of ['createJournalEntry','updateJournalEntry']) this.hooks.push([event,Hooks.on(event,(doc:any,...args:any[])=>this.observe(doc,args.at(-1)))]);
    this.hooks.push(['updateCompendium',Hooks.on('updateCompendium',(pack:any,docs:any[],_options:any,userId:string)=>{
      this.observePack(pack,docs,userId);
    })]);
  }
  async run<T>(command: WriteCommand, args: unknown[], local: () => Promise<T>): Promise<T> {
    const context=this.context();
    if(!context.user?.isGM) throw new Error('O criador de notícias é exclusivo do mestre.');
    const leader=primaryGM(context.users);
    if(!leader || leader.id===context.user.id) return local();
    await this.workspace();
    const current=primaryGM(context.users);
    if(!current || current.id===context.user.id) return local();
    if(!context.user.isGM) throw new Error('O criador de notícias é exclusivo do mestre.');
    const id=crypto.randomUUID().replaceAll('-','').slice(0,16);
    const request={command,args,requester:context.user.id,target:current.id,status:'pending',createdAt:Date.now()};
    const response=new Promise<unknown>((resolve,reject)=>{
      const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('O mestre que coordena as gravações não respondeu. Suas alterações continuam na janela; confira a lista antes de tentar novamente.'));},this.timeout);
      this.pending.set(id,{target:current.id,resolve,reject,timer});
    });
    // Observe may receive the response before create() resolves.
    void response.catch(()=>{});
    let doc:any;let wake:ReturnType<typeof setInterval>|undefined;
    try {
      doc=await this.create({_id:id,name:'HoloNews · Operação da redação',flags:{[MODULE_ID]:{kind:'gm-command',request}}},{pack:PRIVATE_PACK,keepId:true,renderSheet:false});
      if(!doc) throw new Error('Não foi possível encaminhar a gravação.');
      // Re-notify the same authenticated request if the coordinator was still loading.
      // Only a separate wake flag changes: never reset status or submit a second command.
      wake=setInterval(()=>{if(this.pending.has(id))void doc.update({[`flags.${MODULE_ID}.wakeAt`]:Date.now()}).catch(console.warn);},this.wakeDelay);
      const result=await response;
      void doc.delete().catch(console.warn);
      return result as T;
    } catch(error) {
      const waiting=this.pending.get(id);if(waiting){clearTimeout(waiting.timer);this.pending.delete(id);waiting.reject(error);}
      // Keep a timed-out command for diagnosis; never replay a possibly completed write automatically.
      if(doc?.getFlag?.(MODULE_ID,'request')?.status==='complete')void doc.delete().catch(console.warn);
      throw error;
    } finally {clearInterval(wake);}
  }
  observePack(pack:any,docs:any[],userId:string): void {
    if(pack.collection!==PRIVATE_PACK || !this.context().user?.isGM) return;
    for(const doc of docs) this.observe(doc,userId);
    // Remote compendium updates may provide only index changes, with no cached documents.
    // Fetch command entries from the server instead of trusting a module socket payload.
    if(![...this.context().users].some((user:any)=>user.id===userId && user.isGM)) return;
    void (async()=>{
      const index=await pack.getIndex();
      for(const entry of index) if(entry.name==='HoloNews · Operação da redação') {
        const doc=await pack.getDocument(entry._id??entry.id);if(doc) this.observe(doc,userId);
      }
    })().catch(console.error);
  }
  observe(doc:any,userId:string): void {
    if(doc.pack!==PRIVATE_PACK || doc.getFlag(MODULE_ID,'kind')!=='gm-command') return;
    const request=doc.getFlag(MODULE_ID,'request'),context=this.context();
    if(!request || !context.user?.isGM) return;
    const sender=[...context.users].find((u:any)=>u.id===userId);
    if(!sender?.isGM) return;
    if(request.status==='complete' && request.requester===context.user.id && userId===request.target) {
      const waiting=this.pending.get(doc.id);if(!waiting) return;
      clearTimeout(waiting.timer);this.pending.delete(doc.id);
      if(request.error) waiting.reject(new Error(String(request.error)));else waiting.resolve(request.result);
      return;
    }
    if(request.status!=='pending' || request.requester!==userId || request.target!==context.user.id || primaryGM(context.users)?.id!==context.user.id || !Array.isArray(request.args) || !Number.isFinite(request.createdAt) || Math.abs(Date.now()-request.createdAt)>this.timeout || this.processing.has(doc.id)) return;
    this.processing.add(doc.id);
    void (async()=>{
      let result:unknown=null,error:string|undefined;
      try { result=await this.execute(request.command,request.args); }
      catch(reason) { error=reason instanceof Error?reason.message:String(reason); }
      await doc.update({[`flags.${MODULE_ID}.request`]:{...request,status:'complete',result:result??null,...(error?{error}:{})}});
    })().catch(console.error).finally(()=>this.processing.delete(doc.id));
  }
  leadershipChanged(): void {
    const leader=primaryGM(this.context().users)?.id;
    for(const [id,waiting] of this.pending) if(waiting.target!==leader){clearTimeout(waiting.timer);this.pending.delete(id);waiting.reject(new Error('O GM que coordena as gravações mudou durante a operação. Suas alterações permanecem na janela; confira a notícia antes de tentar novamente.'));}
  }
  dispose(): void {
    for(const [event,id] of this.hooks) Hooks.off(event,id);this.hooks=[];
    for(const waiting of this.pending.values()){clearTimeout(waiting.timer);waiting.reject(new Error('A sessão da redação foi encerrada.'));}this.pending.clear();
  }
}
