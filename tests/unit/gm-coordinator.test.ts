import { describe,it,expect } from 'vitest';
import { GMWriteCoordinator } from '../../src/permissions/gm-coordinator';
import { Newsroom } from '../../src/core/newsroom';
import { runNewsroomCommand } from '../../src/core/commands';
import { MemoryNewsStore } from '../../src/storage/memory-store';
import { MODULE_ID,PRIVATE_PACK } from '../../src/constants';

function setup(cached=true) {
 const users=[{id:'a',isGM:true,active:true},{id:'z',isGM:true,active:true},{id:'player',isGM:false,active:true}];
 const docs=new Map<string,any>(),writers:GMWriteCoordinator[]=[],store=new MemoryNewsStore();
 const pack={collection:PRIVATE_PACK,getIndex:async()=>[...docs.values()].map(d=>({_id:d.id,name:d.name})),getDocument:async(id:string)=>docs.get(id)};
 function emit(doc:any,userId:string){for(const w of writers){if(cached)w.observe(doc,userId);else w.observePack(pack,[],userId);}}
 const clients=users.slice(0,2).map((user,i)=>{
  let writer:GMWriteCoordinator;let nextId=0;
  const room=new Newsroom(store,()=>{if(!user.isGM)throw new Error('exclusivo');},()=>`article-${i}-${++nextId}`,()=>{},(command,args,local)=>writer.run(command,args,local));
  writer=new GMWriteCoordinator((command,args)=>runNewsroomCommand(room,command,args),async()=>pack,()=>({user,users}),async(data,options)=>{
   if(!user.isGM || options.pack!==PRIVATE_PACK)throw new Error('Permissão negada.');
   const doc:any={id:data._id,pack:PRIVATE_PACK,name:data.name,flags:structuredClone(data.flags),getFlag:(scope:string,key:string)=>doc.flags[scope]?.[key],delete:async()=>{docs.delete(doc.id);},update:async(next:any)=>{
    doc.flags[MODULE_ID].request=structuredClone(next[`flags.${MODULE_ID}.request`]);emit(doc,doc.flags[MODULE_ID].request.target);return doc;
   }};
   docs.set(doc.id,doc);emit(doc,user.id);return doc;
  },1000);writers.push(writer);return {user,room,writer};
 });return {users,docs,store,clients,writers};
}
describe('Coordenação entre GMs',()=>{
 it('segundo GM cria, salva, publica e retira através da fila do coordenador',async()=>{
  const {clients,docs,store}=setup();const second=clients[1]!;
  let item=await second.room.create();
  item=await second.room.save(item.id,{...item.draft,title:'Notícia do segundo GM',body:'<p>Texto público</p>'},'Notas privadas',item.revision);
  item=await second.room.publish(item.id,item.revision);
  expect((await store.publicArticles())[0]?.title).toBe('Notícia do segundo GM');
  expect(JSON.stringify(await store.publicArticles())).not.toContain('Notas privadas');
  await second.room.unpublish(item.id,item.revision);expect(await store.publicArticles()).toEqual([]);expect(docs.size).toBe(0);
 });
 it('serializa duas gravações simultâneas da mesma revisão e rejeita a segunda sem perder a primeira',async()=>{
  const {clients,store}=setup();const [first,second]=clients;let item=await first!.room.create();
  const result=await Promise.allSettled([first!.room.save(item.id,{...item.draft,title:'A'},'',item.revision),second!.room.save(item.id,{...item.draft,title:'B'},'',item.revision)]);
  expect(result.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(result.filter(r=>r.status==='rejected')).toHaveLength(1);
  expect((await store.get(item.id))?.revision).toBe(item.revision+1);
 });
 it('edita notícias diferentes ao mesmo tempo e aceita o segundo GM após a saída do primeiro',async()=>{
  const {clients,users}=setup();const a=await clients[0]!.room.create(),b=await clients[1]!.room.create();
  const result=await Promise.all([clients[0]!.room.save(a.id,{...a.draft,title:'A'},'',a.revision),clients[1]!.room.save(b.id,{...b.draft,title:'B'},'',b.revision)]);
  expect(result.map(v=>v.draft.title)).toEqual(['A','B']);users[0]!.active=false;
  const saved=await clients[1]!.room.save(b.id,{...b.draft,title:'Após troca'},'',result[1]!.revision);expect(saved.draft.title).toBe('Após troca');
 });
 it('busca comandos pelo índice quando o hook remoto não inclui documentos em cache',async()=>{
  const {clients}=setup(false);const item=await clients[1]!.room.create();expect(item.revision).toBe(1);
 });
 it('ignora requisição que finge um GM mas chega com userId de jogador',async()=>{
  const {clients,store}=setup();const request={command:'create',args:[],requester:'z',target:'a',status:'pending',createdAt:Date.now()};let updates=0;
  const doc={id:'forged',pack:PRIVATE_PACK,getFlag:(_scope:string,key:string)=>key==='kind'?'gm-command':request,update:async()=>{updates++;}};
  clients[0]!.writer.observe(doc,'player');await Promise.resolve();expect(updates).toBe(0);expect(await store.list()).toEqual([]);
 });
 it('transmite alerta global pelo segundo GM e conserva o evento na recuperação de falha',async()=>{
  const {clients,store}=setup();const second=clients[1]!;let item=await second.room.create();
  item=await second.room.save(item.id,{...item.draft,title:'Evacuação',body:'<p>Saia agora</p>',audience:{mode:'gm',users:[]}},'Segredo',item.revision);
  store.failSync=true;await expect(second.room.broadcastUrgent(item.id,item.revision)).rejects.toThrow('Falha');
  const pending=(await store.get(item.id))!;expect(pending.pending).toBe(true);expect(pending.broadcast?.id).toBeTruthy();
  store.failSync=false;const recovered=await second.room.retry(item.id);expect(recovered.broadcast?.id).toBe(pending.broadcast?.id);expect(recovered.pending).toBe(false);
  expect(recovered.published).toMatchObject({urgent:true,audience:{mode:'all',users:[]}});
  const copy=await second.room.duplicate(item.id);expect(copy.broadcast).toBeUndefined();
 });
});

it('não executa uma gravação local nem repete o comando se o coordenador não responde',async()=>{
 const user={id:'z',isGM:true,active:true},users=[{id:'a',isGM:true,active:true},user];let local=0,submitted=0;
 const writer=new GMWriteCoordinator(async()=>{},async()=>({}),()=>({user,users}),async()=>{submitted++;return {getFlag:()=>({status:"pending"})};},20);
 await expect(writer.run('create',[],async()=>{local++;return null;})).rejects.toThrow('não respondeu');expect(local).toBe(0);expect(submitted).toBe(1);writer.dispose();
});

it('recusa novo comando depois que o segundo GM perde o papel',async()=>{
 const {clients,store}=setup();clients[1]!.user.isGM=false;
 await expect(clients[1]!.room.create()).rejects.toThrow('exclusivo');expect(await store.list()).toEqual([]);
});

it('acorda o mesmo comando após inicialização tardia sem reenviar ou executar duas vezes',async()=>{
 const first={id:'a',isGM:true,active:true},second={id:'z',isGM:true,active:true},users=[first,second];let executions=0,submitted=0,wakes=0;
 const leader=new GMWriteCoordinator(async()=>{executions++;return 'gravado';},async()=>({}),()=>({user:first,users}));
 let follower:GMWriteCoordinator;
 follower=new GMWriteCoordinator(async()=>{},async()=>({}),()=>({user:second,users}),async(data)=>{
  submitted++;const doc:any={id:data._id,pack:PRIVATE_PACK,flags:structuredClone(data.flags),getFlag:(scope:string,key:string)=>doc.flags[scope][key],delete:async()=>{},update:async(next:any)=>{
   const result=next[`flags.${MODULE_ID}.request`];let sender=second.id;
   if(result){doc.flags[MODULE_ID].request=result;sender=first.id;}else wakes++;
   leader.observe(doc,sender);follower.observe(doc,sender);return doc;
  }};return doc; // The first create event is missed while the leader loads.
 },1000,5);
 expect(await follower.run('create',[],async()=>{throw new Error('Não usar gravação local');})).toBe('gravado');expect(executions).toBe(1);expect(submitted).toBe(1);expect(wakes).toBeGreaterThanOrEqual(1);leader.dispose();follower.dispose();
});
