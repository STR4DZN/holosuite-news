import type { Article } from '../domain/model';
import type { Newsroom } from './newsroom';
import { migrateLegacy } from '../storage/migrations';

export type WriteCommand = 'create' | 'save' | 'publish' | 'broadcastUrgent' | 'unpublish' | 'retry' | 'duplicate' | 'remove' | 'importBackup' | 'migrateLegacy';
export type WriteDispatcher = <T>(command: WriteCommand, args: unknown[], local: () => Promise<T>) => Promise<T>;
export async function runNewsroomCommand(room: Newsroom, command: WriteCommand, args: unknown[]): Promise<unknown> {
  const id = () => { if(typeof args[0] !== 'string' || !args[0] || args[0].length > 100) throw new Error('Identificador inválido.'); return args[0]; };
  const revision = (index = 1) => { const v=args[index]; if(!Number.isSafeInteger(v) || Number(v)<0) throw new Error('Revisão inválida.');return Number(v); };
  switch(command) {
    case 'create': return room.create();
    case 'save': { if(typeof args[2] !== 'string') throw new Error('Notas inválidas.');return room.save(id(),args[1] as Article,args[2],revision(3)); }
    case 'publish': return room.publish(id(),revision());
    case 'broadcastUrgent': return room.broadcastUrgent(id(),revision());
    case 'unpublish': return room.unpublish(id(),revision());
    case 'retry': return room.retry(id());
    case 'duplicate': return room.duplicate(id());
    case 'remove': return room.remove(id(),revision());
    case 'importBackup': return room.importBackup(args[0]);
    case 'migrateLegacy': return migrateLegacy(room);
    default: throw new Error('Operação de redação desconhecida.');
  }
}
