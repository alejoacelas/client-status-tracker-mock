import type { ItemRef } from '../data/mock';
export function StatusComposer(p: { parent?: ItemRef; preset?: string; editId?: string }) { return <div>{JSON.stringify(p)}</div>; }
