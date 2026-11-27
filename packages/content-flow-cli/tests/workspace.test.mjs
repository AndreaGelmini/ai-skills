import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { init } from '../dist/workspace.js';
test('reinitialization never overwrites unrelated files or existing ideas',async t=>{const root=await mkdtemp(join(tmpdir(),'cf-workspace-'));t.after(()=>rm(root,{recursive:true,force:true}));await init(root);await writeFile(join(root,'ideas','existing.md'),'keep');await writeFile(join(root,'other.txt'),'other');const before=await readFile(join(root,'.content/settings.json'));assert.deepEqual((await init(root)).created,[]);assert.deepEqual(await readFile(join(root,'.content/settings.json')),before);assert.equal(await readFile(join(root,'ideas/existing.md'),'utf8'),'keep');assert.equal(await readFile(join(root,'other.txt'),'utf8'),'other');});
