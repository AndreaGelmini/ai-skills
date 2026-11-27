import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { copyFile, lstat, mkdir, readdir } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { KnowledgeStore } from './knowledge.js';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function expect(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
async function directory(root: string, relative: string, create = false) {
  let p = root; expect((await lstat(p)).isDirectory(),'Invalid workspace');
  for (const part of relative.split('/')) {
    p = join(p,part);
    if (create) try { await mkdir(p,{mode:0o700}); } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e; }
    expect((await lstat(p)).isDirectory(),`Invalid asset directory: ${relative}`);
  }
  return p;
}
export async function asset(workspace: string, action: string, source?: string) {
  const root = resolve(workspace); const store = new KnowledgeStore(root); await store.readSettings();
  const base = '.content/assets'; const inbox = base + '/inbox';
  if (action === 'folder') return store.transaction(async () => { await directory(root,inbox,true); return {status:'ok',path:inbox}; });
  if (action === 'import') return store.transaction(async () => {
    expect(typeof source === 'string' && source.trim(),'Expected source file'); const file = resolve(root,source);
    expect((await lstat(file)).isFile(),'Expected a regular source file, not a symlink'); const name = basename(file);
    expect(name !== '.' && name !== '..' && !/[\\\u0000-\u001f]/.test(name),'Invalid asset filename');
    const dest = base+'/'+randomUUID(); const target = await directory(root,dest,true);
    await copyFile(file,join(target,name),constants.COPYFILE_EXCL);
    return {status:'ok',path:dest+'/'+name,size:(await lstat(join(target,name))).size};
  });
  expect(action === 'list','Expected asset folder|list|import');
  const files:{path:string;size:number;imported:boolean}[] = [];
  try {
    const dir = await directory(root,base);
    for (const item of await readdir(dir)) {
      if (item !== 'inbox' && !uuid.test(item)) continue;
      const sub = await directory(root,base+'/'+item);
      for (const name of await readdir(sub)) { const s = await lstat(join(sub,name)); if (s.isFile()) files.push({path:base+'/'+item+'/'+name,size:s.size,imported:item!=='inbox'}); }
    }
  } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; }
  return {status:'ok',files};
}
