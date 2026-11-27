import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, mkdtemp, writeFile, link, rename, rm, rmdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

type Json = Record<string, unknown>;
const types = { profile: ['identity', 'audience', 'voice', 'scope', 'visual-identity', 'example', 'inspiration'], strategy: ['objectives', 'cadence', 'rubric', 'platform'] } as const;
type Domain = keyof typeof types;
type Status = 'experimental' | 'active' | 'archived';
const singletons = new Set(['identity', 'audience', 'voice', 'scope', 'objectives', 'cadence']);
const token = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hash = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const json = (v: unknown) => JSON.stringify(v, null, 2) + '\n';
const isObject = (v: unknown): v is Json => v !== null && typeof v === 'object' && !Array.isArray(v);
const absent = (e: unknown) => (e as NodeJS.ErrnoException).code === 'ENOENT';
function expect(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(message); }
function id(v: unknown): asserts v is string { expect(typeof v === 'string' && v.length <= 100 && token.test(v), 'Invalid identifier'); }
function text(v: unknown): v is string { return typeof v === 'string' && v.trim().length > 0; }
function positive(v: unknown): v is number { return typeof v === 'number' && Number.isSafeInteger(v) && v > 0; }
function date(v: unknown): v is string { return typeof v === 'string' && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v; }

export type Meta = { schema_version: 1; id: string; domain: Domain; type: string; title: string; summary: string; version: number; status: Status; tags: string[]; created_at: string; updated_at: string; assets?: string[] };
export type Document = { meta: Meta; body: string };
type Entry = { id: string; domain: Domain; version: number; path: string; sha256: string };
type Manifest = { generation: string; parent: string | null; draft_id: string; entries: Entry[] };
type Settings = Json & { schema_version: 2; configuration: 'pending' | 'approved'; active_manifest: string | null };
type Draft = { id: string; base: string | null; documents: string[] };
export type Proposal = { id?: string; domain: Domain; type: string; title: string; summary: string; status: Status; tags: string[]; body: string; assets?: string[] };
export type Filter = { domain?: Domain; type?: string; status?: Status; tag?: string; query?: string; limit?: number };
function validAssetPath(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith('.content/assets/') && v.split('/').length === 4 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v.split('/')[2]) && v.split('/').slice(2).every(p => p !== '' && p !== '.' && p !== '..' && !/[\\\u0000-\u001f]/.test(p));
}
function validMeta(v: unknown): asserts v is Meta {
  expect(isObject(v), 'Invalid document metadata');
  id(v.id);
  expect(v.schema_version === 1 && typeof v.domain === 'string' && Object.hasOwn(types, v.domain), 'Invalid document domain/schema');
  expect((types[v.domain as Domain] as readonly unknown[]).includes(v.type), 'Invalid document type');
  if (singletons.has(v.type as string)) expect(v.id === v.type, 'Invalid singleton ID');
  expect(text(v.title) && text(v.summary) && v.summary.length <= 300 && positive(v.version), 'Invalid document title/summary/version');
  expect(['experimental', 'active', 'archived'].includes(v.status as string), 'Invalid document status');
  expect(Array.isArray(v.tags) && v.tags.every(text) && date(v.created_at) && date(v.updated_at), 'Invalid tags/timestamps');
  if (v.assets !== undefined) expect(Array.isArray(v.assets) && v.assets.every(validAssetPath), 'Invalid asset references');
  expect(Object.keys(v).every(k => ['schema_version','id','domain','type','title','summary','version','status','tags','created_at','updated_at','assets'].includes(k)), 'Unknown metadata field');
}
// Generated frontmatter is a JSON object, a strict subset of YAML 1.2. The body is editable Markdown.
function encode(d: Document): string { validMeta(d.meta); expect(text(d.body), 'Empty document'); return '---\n' + json(d.meta) + '---\n' + d.body.trimEnd() + '\n'; }
function decode(raw: string): Document {
  expect(raw.startsWith('---\n'), 'Missing frontmatter');
  const end = raw.indexOf('\n---\n', 4);
  expect(end >= 0, 'Unterminated frontmatter');
  const meta: unknown = JSON.parse(raw.slice(4, end)); validMeta(meta);
  const body = raw.slice(end + 5); expect(text(body), 'Empty document'); return { meta, body };
}
const rootDir = '.content/knowledge';
const revisionPath = (domain: Domain, doc: string, version: number) => `${rootDir}/${domain}/${doc}/v${version}.md`;
const draftDir = (draft: string) => `${rootDir}/drafts/${draft}`;
function validEntry(v: unknown): asserts v is Entry {
  expect(isObject(v), 'Invalid manifest entry'); id(v.id);
  expect(typeof v.domain === 'string' && Object.hasOwn(types, v.domain) && positive(v.version), 'Invalid manifest domain/version');
  expect(v.path === revisionPath(v.domain as Domain, v.id, v.version) && typeof v.sha256 === 'string' && /^[a-f0-9]{64}$/.test(v.sha256), 'Invalid manifest path/hash');
}

export class KnowledgeStore {
  private root: string;
  private held = false;
  constructor(workspace: string) { this.root = resolve(workspace); }
  // All managed paths are generated or validated. Reject symlinks at every managed component.
  private async dir(relative: string, create = false): Promise<string> {
    let path = this.root; expect((await lstat(path)).isDirectory(), 'Invalid workspace directory');
    for (const part of relative.split('/').filter(Boolean)) {
      path = join(path, part);
      if (create) { try { await mkdir(path, { mode: 0o700 }); } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e; } }
      expect((await lstat(path)).isDirectory(), `Invalid managed directory: ${relative}`);
    }
    return path;
  }
  private async path(relative: string, create = false): Promise<string> {
    const slash = relative.lastIndexOf('/'); const parent = await this.dir(relative.slice(0, slash), create);
    const p = join(parent, relative.slice(slash + 1));
    try { expect((await lstat(p)).isFile(), `Invalid managed file: ${relative}`); } catch (e) { if (!absent(e)) throw e; }
    return p;
  }
  private async read(relative: string): Promise<string> { return readFile(await this.path(relative), 'utf8'); }
  private async write(relative: string, raw: string, immutable = false): Promise<void> {
    const target = await this.path(relative, true); const parent = await this.dir(relative.slice(0, relative.lastIndexOf('/')));
    const temp = await mkdtemp(join(parent, '.write-'));
    try { const file = join(temp, 'data'); await writeFile(file, raw, { flag: 'wx', mode: 0o600 });
      if (immutable) await link(file, target); else await rename(file, target);
    } finally { await rm(temp, { recursive: true, force: true }); }
  }
  private async settings(): Promise<{ raw: string; value: Settings }> {
    const raw = await this.read('.content/settings.json'); const v: unknown = JSON.parse(raw);
    expect(isObject(v) && v.schema_version === 2, 'Expected schema 2 workspace; existing settings unchanged');
    expect(v.configuration === 'pending' || v.configuration === 'approved', 'Invalid configuration');
    if (v.active_manifest !== null) id(v.active_manifest);
    return { raw, value: v as Settings };
  }
  private async manifest(generation: string | null): Promise<Manifest> {
    if (generation === null) return { generation: '', parent: null, draft_id: '', entries: [] };
    id(generation); const v: unknown = JSON.parse(await this.read(`${rootDir}/manifests/${generation}.json`));
    expect(isObject(v) && v.generation === generation && Array.isArray(v.entries), 'Invalid selection manifest');
    if (v.parent !== null) id(v.parent); id(v.draft_id);
    const seen = new Set<string>();
    for (const e of v.entries) { validEntry(e); expect(!seen.has(e.id), 'Duplicate manifest ID'); seen.add(e.id); }
    return v as unknown as Manifest;
  }
  private async *history(generation: string | null) {
    const seen = new Set<string>();
    while (generation !== null) {
      expect(!seen.has(generation), 'Manifest ancestry cycle'); seen.add(generation);
      const m = await this.manifest(generation); yield m; generation = m.parent;
    }
  }
  private async revision(e: Entry): Promise<Document> {
    const raw = await readFile(await this.path(e.path)); expect(hash(raw) === e.sha256, `Integrity conflict: ${e.id}`);
    const d = decode(raw.toString('utf8')); expect(d.meta.id === e.id && d.meta.version === e.version && d.meta.domain === e.domain, 'Revision metadata mismatch');
    for (const asset of d.meta.assets ?? []) expect((await lstat(await this.path(asset))).isFile(), `Missing asset: ${asset}`);
    return d;
  }
  private async locked<T>(fn: () => Promise<T>): Promise<T> {
    if (this.held) return fn();
    await this.settings(); // Refuse legacy workspace before any mutation.
    const dir = await this.dir(rootDir, true); const lock = join(dir, '.lock');
    try { await mkdir(lock, { mode: 0o700 }); } catch (e) { if ((e as NodeJS.ErrnoException).code === 'EEXIST') throw new Error('Knowledge Store writer locked; inspect before recovery'); throw e; }
    try { return await fn(); } finally { await rmdir(lock); }
  }
  // The setup layer groups its local writes under the same writer lock.
  async transaction<T>(fn: (tx: KnowledgeStore) => Promise<T>): Promise<T> {
    return this.locked(async () => {
      const tx = new KnowledgeStore(this.root); tx.held = true;
      try { return await fn(tx); } finally { tx.held = false; }
    });
  }
  async readSettings() { return (await this.settings()).value; }
  async readSetupState(): Promise<unknown> {
    await this.settings();
    try { return JSON.parse(await this.read('.content/setup-draft.json')); }
    catch (e) { if (absent(e)) return null; throw e; }
  }
  async writeSetupState(state: unknown): Promise<void> {
    expect(this.held, 'Setup state requires writer transaction');
    await this.write('.content/setup-draft.json', json(state));
  }
  private async draft(draftId: string): Promise<Draft> {
    id(draftId); const v: unknown = JSON.parse(await this.read(`${draftDir(draftId)}/draft.json`));
    expect(isObject(v) && v.id === draftId && Array.isArray(v.documents), 'Invalid draft');
    if (v.base !== null) id(v.base); for (const doc of v.documents) id(doc);
    expect(new Set(v.documents).size === v.documents.length, 'Duplicate draft ID'); return v as unknown as Draft;
  }
  async begin(): Promise<string> { return this.locked(async () => {
    const { value } = await this.settings(); const draftId = randomUUID();
    await this.write(`${draftDir(draftId)}/draft.json`, json({ id: draftId, base: value.active_manifest, documents: [] }), true); return draftId;
  }); }
  async save(draftId: string, p: Proposal): Promise<string> { return this.locked(async () => {
    const d = await this.draft(draftId); const { value } = await this.settings(); expect(d.base === value.active_manifest, 'Stale draft');
    const m = await this.manifest(d.base); const docId = p.id ?? (singletons.has(p.type) ? p.type : randomUUID()); id(docId);
    const previous = m.entries.find(e => e.id === docId); const prior = previous ? (await this.revision(previous)).meta : undefined;
    if (p.id && !prior && !d.documents.includes(docId) && !singletons.has(p.type)) throw new Error('Unknown document ID');
    if (prior) expect(prior.type === p.type && prior.domain === p.domain, 'Cannot change document type/domain');
    const now = new Date().toISOString(); const meta: Meta = { schema_version: 1, id: docId, domain: p.domain, type: p.type, title: p.title, summary: p.summary, version: (prior?.version ?? 0) + 1, status: p.status, tags: p.tags, created_at: prior?.created_at ?? now, updated_at: now, ...(p.assets === undefined ? {} : { assets: p.assets }) };
    if (d.documents.includes(docId)) { const existing = decode(await this.read(`${draftDir(draftId)}/${docId}.md`)).meta; expect(existing.type === p.type && existing.domain === p.domain, 'Cannot change draft type/domain'); meta.created_at = existing.created_at; }
    await this.write(`${draftDir(draftId)}/${docId}.md`, encode({ meta, body: p.body }));
    if (!d.documents.includes(docId)) { d.documents.push(docId); await this.write(`${draftDir(draftId)}/draft.json`, json(d)); } return docId;
  }); }
  async withdraw(draftId: string, docId: string): Promise<void> { return this.locked(async () => {
    id(docId); const d = await this.draft(draftId); const { value } = await this.settings();
    expect(d.base === value.active_manifest && d.documents.includes(docId), 'Unknown or stale draft document');
    d.documents = d.documents.filter(x => x !== docId);
    // Leave the prior candidate file intact; it is no longer selected by the draft.
    await this.write(`${draftDir(draftId)}/draft.json`, json(d));
  }); }
  async approve(draftId: string, updates?: Json): Promise<string> { return this.locked(async () => {
    const d = await this.draft(draftId); const s = await this.settings();
    // A retry after successful selection (even after later approvals) is safe.
    for await (const m of this.history(s.value.active_manifest)) if (m.draft_id === draftId) return m.generation;
    expect(d.base === s.value.active_manifest && (d.documents.length > 0 || updates !== undefined), 'Empty or stale draft');
    if (updates) { expect(this.held, 'Settings updates require writer transaction'); expect(!Object.hasOwn(updates, 'active_manifest') && !Object.hasOwn(updates, 'schema_version'), 'Cannot override selection or schema'); }
    const old = await this.manifest(d.base); const entries = new Map(old.entries.map(e => [e.id, e]));
    for (const e of old.entries) await this.revision(e);
    const docs: Document[] = [];
    for (const docId of d.documents) {
      const doc = decode(await this.read(`${draftDir(draftId)}/${docId}.md`)); const prev = entries.get(docId);
      expect(doc.meta.id === docId && doc.meta.version === (prev?.version ?? 0) + 1, 'Draft identity/version mismatch');
      if (prev) { const prior = (await this.revision(prev)).meta; expect(prior.domain === doc.meta.domain && prior.type === doc.meta.type, 'Draft type/domain mismatch'); }
      for (const asset of doc.meta.assets ?? []) expect((await lstat(await this.path(asset))).isFile(), `Missing asset: ${asset}`);
      docs.push(doc);
    }
    // Interrupted pre-commit attempts leave unreachable revisions/manifests, never overwrite them.
    const generation = randomUUID();
    for (const doc of docs) {
      const dir = await this.dir(`${rootDir}/${doc.meta.domain}/${doc.meta.id}`, true);
      const versions = (await readdir(dir)).map(n => /^v([1-9][0-9]*)\.md$/.exec(n)).filter(Boolean).map(m => Number(m![1]));
      doc.meta.version = Math.max(doc.meta.version - 1, ...versions) + 1; expect(positive(doc.meta.version), 'Version exhausted');
      doc.meta.updated_at = new Date().toISOString(); const raw = encode(doc); const path = revisionPath(doc.meta.domain, doc.meta.id, doc.meta.version);
      await this.write(path, raw, true); entries.set(doc.meta.id, { id: doc.meta.id, domain: doc.meta.domain, version: doc.meta.version, path, sha256: hash(raw) });
    }
    await this.write(`${rootDir}/manifests/${generation}.json`, json({ generation, parent: d.base, draft_id: draftId, entries: [...entries.values()].sort((a,b) => a.id.localeCompare(b.id)) }), true);
    expect((await this.settings()).raw === s.raw, 'Settings changed during approval');
    await this.write('.content/settings.json', json({ ...s.value, ...updates, active_manifest: generation })); return generation;
  }); }
  async readDocument(docId: string, version?: number): Promise<Document> { return (await this.readDocuments([docId], version))[0]; }
  async readDocuments(docIds: string[], version?: number): Promise<Document[]> {
    const { value } = await this.settings(); const current = await this.manifest(value.active_manifest);
    return Promise.all(docIds.map(docId => this.readAt(current, docId, version)));
  }
  private async readAt(current: Manifest, docId: string, version?: number): Promise<Document> {
    id(docId); const e = current.entries.find(x => x.id === docId); expect(e, 'Unknown document');
    if (version === undefined || version === e.version) return this.revision(e);
    expect(positive(version), 'Invalid version');
    for await (const m of this.history(current.parent)) { const historical = m.entries.find(x => x.id === docId && x.version === version); if (historical) return this.revision(historical); }
    throw new Error('Unknown approved revision');
  }
  async readDraft(draftId: string, skipCommittedBodies = false): Promise<{ base: string | null; committed_generation: string | null; documents: Document[] }> {
    const { value } = await this.settings(); const d = await this.draft(draftId); let committed: string | null = null;
    for await (const m of this.history(value.active_manifest)) if (m.draft_id === draftId) { committed = m.generation; break; }
    return { base: d.base, committed_generation: committed, documents: committed && skipCommittedBodies ? [] : await Promise.all(d.documents.map(async docId => {
      const doc = decode(await this.read(`${draftDir(draftId)}/${docId}.md`)); expect(doc.meta.id === docId, 'Draft identity mismatch'); return doc;
    })) };
  }
  async list(filter: Filter = {}, all = false) {
    const { value } = await this.settings(); const m = await this.manifest(value.active_manifest); const documents: (Meta & { path: string })[] = []; const errors: { id: string; message: string }[] = [];
    const limit = filter.limit ?? 50; expect(positive(limit) && limit <= 500, 'Invalid limit');
    if (filter.domain !== undefined) expect(Object.hasOwn(types, filter.domain), 'Invalid domain filter');
    if (filter.status !== undefined) expect(['experimental', 'active', 'archived'].includes(filter.status), 'Invalid status filter');
    if (filter.type !== undefined) expect(Object.values(types).some(values => (values as readonly string[]).includes(filter.type!)), 'Invalid type filter');
    if (filter.query !== undefined) expect(text(filter.query), 'Empty search query');
    if (filter.tag !== undefined) expect(text(filter.tag), 'Empty tag filter');
    for (const e of m.entries) { try {
      const { meta, body } = await this.revision(e);
      if (filter.domain && meta.domain !== filter.domain || filter.type && meta.type !== filter.type || (filter.status ? meta.status !== filter.status : meta.status === 'archived') || filter.tag && !meta.tags.includes(filter.tag)) continue;
      if (filter.query && ![meta.title, meta.summary, ...meta.tags, body].join('\n').toLowerCase().includes(filter.query.toLowerCase())) continue;
      documents.push({ ...meta, path: e.path });
    } catch (e2) { errors.push({ id: e.id, message: String(e2) }); } }
    return { generation: value.active_manifest, total: documents.length, documents: all ? documents : documents.slice(0, limit), errors };
  }
  async search(query: string, filter: Omit<Filter, 'query'> = {}) { return this.list({ ...filter, query }); }
  async reindex() { return this.locked(async () => {
    // Rebuild all current metadata including archives; discovery filters are applied separately.
    const { value } = await this.settings(); const m = await this.manifest(value.active_manifest); const documents = []; const errors = [];
    for (const e of m.entries) { try { documents.push({ ...(await this.revision(e)).meta, path: e.path }); } catch (error) { errors.push({ id: e.id, message: String(error) }); } }
    const result = { generation: value.active_manifest, documents, errors }; await this.write(`${rootDir}/index.json`, json(result)); return result;
  }); }
  async archive(draftId: string, docId: string): Promise<string> { const d = await this.readDocument(docId); return this.save(draftId, { ...d.meta, status: 'archived', body: d.body }); }
}
