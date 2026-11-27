#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { check,init } from './workspace.js';
import { setup } from './setup.js';
import { KnowledgeStore, type Filter } from './knowledge.js';
import { asset } from './assets.js';
async function stdinJson(): Promise<unknown> { let text = ''; for await (const chunk of process.stdin) text += chunk; return JSON.parse(text); }
const help = `Usage: content-flow [--workspace PATH] <command>
  --version | --help
  check | init
  setup read [--details] | save (JSON stdin) | approve | discard
  knowledge list [--domain DOMAIN] [--type TYPE] [--tag TAG] [--status STATUS] [--limit N]
  knowledge search --query TEXT [same filters]
  knowledge read ID [ID ...] [--version-number N]
  knowledge save (one document JSON stdin, including provenance) | archive ID | approve | reindex
  asset folder | list | import PATH`;
function expect(ok: unknown, msg: string): asserts ok { if (!ok) throw new Error(msg); }
function integer(x: string|undefined) { if (x === undefined) return undefined; const n = Number(x); expect(/^\d+$/.test(x) && Number.isSafeInteger(n) && n > 0,'Expected positive integer'); return n; }
try {
  const {values:v,positionals:p} = parseArgs({options:{workspace:{type:'string'},help:{type:'boolean',short:'h'},version:{type:'boolean'},details:{type:'boolean'},domain:{type:'string'},type:{type:'string'},tag:{type:'string'},status:{type:'string'},query:{type:'string'},limit:{type:'string'},'version-number':{type:'string'}},allowPositionals:true});
  if (v.help) console.log(help);
  else if (v.version) console.log(JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).version);
  else {
    expect(v.workspace !== '', 'Workspace path cannot be empty'); const root = v.workspace ?? process.cwd();
    const [cmd,action,...args] = p; const store = new KnowledgeStore(root); let result:unknown;
    if ((cmd==='check'||cmd==='init') && p.length===1) result = await (cmd==='check'?check:init)(root);
    else if (cmd==='setup' && p.length===2 && ['read','save','approve','discard'].includes(action)) result = await setup(root,action,action==='save'?await stdinJson():undefined,v.details);
    else if (cmd==='knowledge') {
      if (action==='list'||action==='search') { expect(args.length===0,'Unexpected arguments'); const filter:Filter = {domain:v.domain as Filter['domain'],type:v.type,status:v.status as Filter['status'],tag:v.tag,limit:integer(v.limit)}; expect(action!=='search'||!!v.query,'Search requires --query'); const r = action==='search'?await store.search(v.query!,filter):await store.list(filter); result={status:r.errors.length?'error':'ok',...r}; }
      else if (action==='read') { expect(args.length>0,'Expected document IDs'); result={status:'ok',documents:await store.readDocuments(args,integer(v['version-number']))}; }
      else if (action==='reindex' && !args.length) { const r=await store.reindex();result={status:r.errors.length?'error':'ok',...r}; }
      else if (action==='save' && !args.length) result=await setup(root,'save',{documents:[await stdinJson()]},v.details);
      else if (action==='archive' && args.length===1) result=await setup(root,'save',{archive:args},v.details);
      else if (action==='approve' && !args.length) result=await setup(root,'approve',undefined,v.details);
      else throw new Error('Unknown knowledge command');
    } else if (cmd==='asset' && ((['folder','list'].includes(action)&&!args.length)||(action==='import'&&args.length===1))) result=await asset(root,action,args[0]);
    else throw new Error('Unknown command; use --help');
    console.log(JSON.stringify(result,null,2)); const status=(result as {status:string}).status; process.exitCode=status==='ok'?0:status==='incomplete'?1:2;
  }
} catch (e) { console.log(JSON.stringify({status:'error',errors:[{message:e instanceof Error?e.message:String(e)}]},null,2)); process.exitCode=2; }
