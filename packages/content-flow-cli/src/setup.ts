import { createHash } from 'node:crypto';
import { KnowledgeStore, type Document, type Meta, type Proposal } from './knowledge.js';
import { check } from './workspace.js';

type Json = Record<string, unknown>;
type Provenance = 'confirmed' | 'inferred' | 'proposed';
type FieldState = 'deferred' | 'declined';
type Mark = { provenance: Provenance; fingerprint: string };
type DraftState = { draft_id: string; technical: Json; fields: Record<string, FieldState>; marks: Record<string, Mark> };
const required = ['identity','objectives','audience','voice','scope','platforms','memory_enabled','startup_status'] as const;
const optional = ['rubrics','examples','visual','locale','cadence','tools','memory_support_threshold','memory_contrary_threshold'] as const;
const thresholds = ['memory_support_threshold','memory_contrary_threshold'] as const;
const defaults = { memory_support_threshold: 5, memory_contrary_threshold: 10 };
const technicalKeys = ['memory_enabled','startup_status',...thresholds,'language','timezone','tools'] as const;
const obj = (x: unknown): x is Json => !!x && typeof x === 'object' && !Array.isArray(x);
const text = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0;
function expect(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
function keys(v: Json, allowed: readonly string[], label: string) { expect(Object.keys(v).every(k => allowed.includes(k)), `Unknown ${label} field`); }
function technical(v: unknown): asserts v is Json {
  expect(obj(v), 'Expected technical object'); keys(v, technicalKeys, 'technical');
  for (const [k,x] of Object.entries(v)) {
    if (k === 'memory_enabled' || k === 'startup_status') expect(typeof x === 'boolean', `${k}: expected boolean`);
    else if ((thresholds as readonly string[]).includes(k)) expect(x === null || typeof x === 'number' && Number.isSafeInteger(x) && x > 0, `${k}: expected positive integer or null (default)`);
    else expect(text(x), `${k}: expected nonempty string`);
  }
}
function fields(v: unknown): asserts v is Record<string, FieldState> {
  expect(obj(v), 'Expected fields object'); keys(v, optional, 'optional');
  expect(Object.values(v).every(x => x === 'deferred' || x === 'declined'), 'Expected deferred or declined');
}
function activeTechnical(s: Json): Json { const result = Object.fromEntries(technicalKeys.filter(k => Object.hasOwn(s,k)).map(k => [k,s[k]])); technical(result); return result; }
function fingerprint(d: Document) { return createHash('sha256').update(JSON.stringify(d)).digest('hex'); }
function provenance(d: Document, state: DraftState): Provenance {
  const m = state.marks[d.meta.id]; return m && m.fingerprint === fingerprint(d) ? m.provenance : 'proposed';
}
function validateState(raw: unknown): asserts raw is DraftState {
  expect(obj(raw) && text(raw.draft_id) && obj(raw.marks), 'Invalid setup draft state');
  technical(raw.technical); fields(raw.fields);
  for (const m of Object.values(raw.marks)) expect(obj(m) && ['confirmed','inferred','proposed'].includes(m.provenance as string) && typeof m.fingerprint === 'string' && /^[a-f0-9]{64}$/.test(m.fingerprint), 'Invalid confirmation mark');
}
async function load(store: KnowledgeStore) {
  const settings = await store.readSettings(); const raw = await store.readSetupState();
  if (raw === null) return { settings, state: null, draft: null };
  validateState(raw); const draft = await store.readDraft(raw.draft_id, true);
  if (draft.committed_generation) return { settings, state: null, draft: null };
  expect(draft.base === settings.active_manifest, 'Stale setup draft; discard explicitly to start again');
  return { settings, state: raw, draft };
}
function coverage(docs: Meta[], tech: Json, notes: Record<string,FieldState>) {
  const active = docs.filter(d => d.status !== 'archived');
  const has = (type: string) => active.some(d => d.type === type);
  const answered: Record<string, boolean> = { identity:has('identity'), objectives:has('objectives'), audience:has('audience'), voice:has('voice'), scope:has('scope'), platforms:has('platform'), memory_enabled:typeof tech.memory_enabled === 'boolean', startup_status:typeof tech.startup_status === 'boolean', rubrics:has('rubric'), examples:has('example'), visual:has('visual-identity'), locale: text(tech.language) && text(tech.timezone), cadence:has('cadence'), tools:text(tech.tools), memory_support_threshold:Object.hasOwn(tech,thresholds[0]), memory_contrary_threshold:Object.hasOwn(tech,thresholds[1]) };
  const states: Record<string,string> = {};
  for (const k of [...required,...optional]) states[k] = (thresholds as readonly string[]).includes(k) && tech.memory_enabled !== true ? (tech.memory_enabled === false ? 'inapplicable' : 'blocked') : answered[k] ? 'answered' : notes[k] ?? 'unanswered';
  return { states, missing: required.filter(k => !answered[k]), blocked_optional: optional.filter(k => states[k] === 'blocked'), inapplicable_optional: optional.filter(k => states[k] === 'inapplicable'), unaddressed_optional: optional.filter(k => states[k] === 'unanswered') };
}
async function view(store: KnowledgeStore, details = false) {
  const {settings,state,draft} = await load(store); const active = await store.list({},true);
  const archived = await store.list({status:'archived'},true);
  const selected = new Map([...active.documents,...archived.documents].map(d => [d.id,d as Meta]));
  for (const d of draft?.documents ?? []) selected.set(d.meta.id,d.meta);
  const tech = state?.technical ?? activeTechnical(settings); const notes = state?.fields ?? (settings.field_states ?? {}); fields(notes);
  const docs = (draft?.documents ?? []).map(d => ({...d.meta, provenance:provenance(d,state!), ...(details ? {body:d.body} : {})}));
  const errors = [...active.errors,...archived.errors.filter(x => !active.errors.some(y => x.id === y.id))];
  return { status: errors.length ? 'error' as const : 'ok' as const, configuration:settings.configuration, active_manifest:settings.active_manifest, active_documents:active.documents, active_technical:activeTechnical(settings), technical:tech, draft:state ? { id:state.draft_id, base:draft!.base, documents:docs } : null, required, optional, defaults, ...coverage([...selected.values()],tech,notes), unconfirmed:docs.filter(d => d.provenance !== 'confirmed').map(d => d.id), errors };
}
function validatePatch(input: unknown) {
  expect(obj(input), 'Expected setup patch'); keys(input,['technical','fields','documents','confirm','withdraw','archive'],'setup');
  expect(Object.keys(input).length > 0, 'Empty setup patch');
  if (input.technical !== undefined) technical(input.technical);
  if (input.fields !== undefined) fields(input.fields);
  for (const k of ['confirm','withdraw','archive']) if (input[k] !== undefined) expect(Array.isArray(input[k]) && (input[k] as unknown[]).every(text), `Expected ${k} ID array`);
  if (input.documents !== undefined) {
    expect(Array.isArray(input.documents), 'Expected documents array');
    for (const p of input.documents) {
      expect(obj(p), 'Expected document object'); keys(p,['id','domain','type','title','summary','status','tags','body','assets','provenance'],'document');
      expect(['confirmed','inferred','proposed'].includes(p.provenance as string), 'Explicit document provenance required');
    }
  }
  return input as { technical?:Json; fields?:Record<string,FieldState>; documents?:(Proposal & {provenance:Provenance})[]; confirm?:string[]; withdraw?:string[]; archive?:string[] };
}
export async function setup(workspace: string, action: string, input?: unknown, details = false) {
  const ready = await check(workspace); expect(ready.status === 'ok', `Workspace not ready: ${JSON.stringify(ready)}`);
  const store = new KnowledgeStore(workspace);
  if (action === 'read') return view(store,details);
  const patch = action === 'save' ? validatePatch(input) : null;
  return store.transaction(async tx => {
    // Explicit discard may recover a stale candidate; historical files are retained.
    if (action === 'discard') { await tx.writeSetupState(null); return view(tx,details); }
    const {settings,state:existing} = await load(tx);
    if (action === 'approve') {
      expect(existing,'No setup draft to approve');
      const before = await view(tx); expect(before.status === 'ok','Knowledge integrity conflict');
      expect(!before.missing.length, `Missing required fields: ${before.missing.join(', ')}`);
      expect(!before.unconfirmed.length, `Unconfirmed documents: ${before.unconfirmed.join(', ')}`);
      const selected = {...existing.technical};
      if (selected.memory_enabled === true) for (const k of thresholds) selected[k] ??= defaults[k];
      await tx.approve(existing.draft_id,{...selected,configuration:'approved',publishing_mode:'manual',field_states:existing.fields});
      // A committed draft is ignored even if process interruption prevents this cleanup.
      await tx.writeSetupState(null);
      // Index is a derived view; failure cannot undo the committed selection.
      let warning: string | undefined;
      try { const index = await tx.reindex(); if (index.errors.length) warning = 'Knowledge index contains integrity errors; inspect and reindex.'; }
      catch (e) { warning = 'Approved; index refresh failed: ' + String(e); }
      return { ...(await view(tx,details)), ...(warning ? {warnings:[warning]} : {}) };
    }
    expect(action === 'save' && patch,'Expected setup read|save|approve|discard');
    const state: DraftState = existing ?? {draft_id:await tx.begin(),technical:activeTechnical(settings),fields:{},marks:{}};
    if (!existing) { const notes = settings.field_states ?? {}; fields(notes); state.fields = {...notes}; await tx.writeSetupState(state); }
    for (const docId of patch.withdraw ?? []) { await tx.withdraw(state.draft_id,docId); delete state.marks[docId]; }
    const mark = async (docId:string,p:Provenance) => {
      const d = (await tx.readDraft(state.draft_id)).documents.find(x => x.meta.id === docId); expect(d,`Unknown candidate document: ${docId}`);
      state.marks[docId] = { provenance:p, fingerprint:fingerprint(d) };
    };
    for (const p of patch.documents ?? []) { const docId = await tx.save(state.draft_id,p); await mark(docId,p.provenance); }
    for (const docId of patch.archive ?? []) { await tx.archive(state.draft_id,docId); await mark(docId,'proposed'); }
    for (const docId of patch.confirm ?? []) await mark(docId,'confirmed');
    Object.assign(state.technical,patch.technical ?? {}); Object.assign(state.fields,patch.fields ?? {});
    // An interrupted save can leave unmarked candidate documents; they remain proposed.
    await tx.writeSetupState(state); return view(tx,details);
  });
}
