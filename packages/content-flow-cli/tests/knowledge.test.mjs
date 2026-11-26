import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, symlink, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { KnowledgeStore } from '../dist/knowledge.js';

const sample = { domain: 'strategy', type: 'rubric', title: 'Experiments', summary: 'Practical projects', status: 'experimental', tags: ['tech'], body: '# Projects\n\nTry a new protocol.' };
const voice = { domain: 'profile', type: 'voice', title: 'Voice', summary: 'Direct writing', status: 'active', tags: [], body: 'Use plain language.' };
async function fixture(t, schema = 2) {
  const root = await mkdtemp(join(tmpdir(), 'knowledge-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, '.content'));
  await writeFile(join(root, '.content/settings.json'), JSON.stringify({ schema_version: schema, configuration: 'pending', active_manifest: null }));
  return { root, store: new KnowledgeStore(root), settings: join(root, '.content/settings.json'), knowledge: join(root, '.content/knowledge') };
}
async function seed(store) {
  const draft = await store.begin(); const id = await store.save(draft, sample); await store.save(draft, voice); const generation = await store.approve(draft); return { id, draft, generation };
}
test('drafts stay invisible; approval publishes only selected revisions; retry is idempotent', async t => {
  const { store, settings } = await fixture(t); const draft = await store.begin(); const id = await store.save(draft, sample);
  assert.deepEqual((await store.list()).documents, []); assert.equal((await store.readDraft(draft)).documents[0].body.trim(), sample.body);
  await assert.rejects(store.readDocument(id), /Unknown document/);
  const g = await store.approve(draft); assert.equal(JSON.parse(await readFile(settings, 'utf8')).active_manifest, g);
  assert.equal((await store.list()).total, 1); assert.equal((await store.readDocument(id)).meta.version, 1);
  assert.equal(await store.approve(draft), g); assert.equal((await store.readDraft(draft)).committed_generation, g);
});
test('renaming and updating one entity preserves other revisions and history', async t => {
  const { store, root } = await fixture(t); const { id, draft: initial, generation } = await seed(store);
  const initialVoice = (await store.list({ domain: 'profile' })).documents[0]; const initialBytes = await readFile(join(root, initialVoice.path));
  const draft = await store.begin(); await store.save(draft, { ...sample, id, title: 'Renamed', body: 'Updated' });
  assert.equal((await store.readDocument(id)).meta.title, sample.title); await store.approve(draft);
  assert.equal((await store.readDocument(id)).meta.title, 'Renamed'); assert.equal((await store.readDocument(id, 1)).meta.title, sample.title);
  assert.deepEqual((await store.list({ domain: 'profile' })).documents[0], initialVoice); assert.deepEqual(await readFile(join(root, initialVoice.path)), initialBytes);
  assert.equal(await store.approve(initial), generation);
});
test('search is bounded and metadata-only; archive is staged and historical content survives', async t => {
  const { store } = await fixture(t); const { id } = await seed(store);
  const result = await store.search('PROTOCOL', { tag: 'tech', limit: 1 }); assert.equal(result.total, 1); assert.equal(result.documents[0].id, id); assert.ok(!Object.hasOwn(result.documents[0], 'body'));
  assert.equal((await store.search('not present')).total, 0); await assert.rejects(store.list({ limit: 0 }), /limit/);
  const draft = await store.begin(); await store.archive(draft, id); assert.equal((await store.list()).total, 2); await store.approve(draft);
  assert.equal((await store.list()).total, 1); assert.equal((await store.list({ status: 'archived' })).documents[0].id, id);
  assert.equal((await store.readDocument(id, 1)).meta.status, 'experimental');
});
test('stale concurrent drafts cannot overwrite a committed selection', async t => {
  const { store } = await fixture(t); const a = await store.begin(), b = await store.begin(); await store.save(a, voice); await store.save(b, sample); await store.approve(a);
  await assert.rejects(store.approve(b), /stale draft/); await assert.rejects(store.save(b, voice), /Stale draft/); assert.equal((await store.list()).total, 1);
});
test('manual draft body edits can be approved; active file edits and removals are reported', async t => {
  const { root, store, knowledge } = await fixture(t); const d = await store.begin(); const id = await store.save(d, voice);
  const path = join(knowledge, 'drafts', d, id + '.md'); await writeFile(path, (await readFile(path, 'utf8')).replace('Use plain language.', 'Use concrete examples.'));
  await store.approve(d); assert.equal((await store.readDocument(id)).body.trim(), 'Use concrete examples.');
  const p = join(root, (await store.list()).documents[0].path); await writeFile(p, 'external edit');
  await assert.rejects(store.readDocument(id), /Integrity conflict/); assert.equal((await store.list()).errors.length, 1); assert.equal((await store.list()).total, 0);
  await rm(p); assert.equal((await store.list()).errors.length, 1);
});
test('index is rebuildable after deletion or corruption, not authoritative', async t => {
  const { store, knowledge } = await fixture(t); await seed(store); const expected = await store.reindex();
  await writeFile(join(knowledge, 'index.json'), 'broken'); assert.equal((await store.list()).total, 2); assert.deepEqual(await store.reindex(), expected);
  await rm(join(knowledge, 'index.json')); assert.deepEqual(await store.reindex(), expected);
});
test('invalid drafts, path traversal, and unknown types are rejected without selection changes', async t => {
  const { store, settings } = await fixture(t); const before = await readFile(settings); const d = await store.begin();
  await assert.rejects(store.save(d, { ...sample, id: '../escape' }), /Invalid identifier/);
  await assert.rejects(store.save(d, { ...sample, domain: 'unknown' }), /Invalid document domain/);
  await assert.rejects(store.save(d, { ...voice, body: '' }), /Empty document/);
  await assert.rejects(store.approve(d), /Empty or stale/); assert.deepEqual(await readFile(settings), before);
});
test('schema 1 is rejected without creating or changing files', async t => {
  const { store, root, settings } = await fixture(t, 1); const before = await readFile(settings);
  await assert.rejects(store.begin(), /schema 2/); await assert.rejects(store.list(), /schema 2/);
  assert.deepEqual(await readdir(join(root, '.content')), ['settings.json']); assert.deepEqual(await readFile(settings), before);
});
test('managed symlinks and existing writer locks are rejected', { skip: process.platform === 'win32' }, async t => {
  const { root, store, knowledge } = await fixture(t); await mkdir(join(root, 'outside')); await symlink(join(root, 'outside'), knowledge, 'dir');
  await assert.rejects(store.begin(), /Invalid managed directory/); assert.deepEqual(await readdir(join(root, 'outside')), []); await rm(knowledge);
  await mkdir(join(knowledge, '.lock'), { recursive: true }); await assert.rejects(store.begin(), /writer locked/);
});
test('partial approval failure preserves old selection and retry does not overwrite orphan revisions', async t => {
  const { store, knowledge, settings } = await fixture(t); await seed(store); const before = await readFile(settings); const d = await store.begin();
  const a = await store.save(d, { ...voice, body: 'Candidate voice' }); const b = await store.save(d, sample);
  // Force failure after the first revision is written, using a file in place of a directory.
  await writeFile(join(knowledge, 'strategy', b), 'obstruction');
  await assert.rejects(store.approve(d)); assert.deepEqual(await readFile(settings), before);
  assert.equal((await store.readDocument(a)).meta.version, 1); const orphan = join(knowledge, 'profile', a, 'v2.md'); const bytes = await readFile(orphan);
  await rm(join(knowledge, 'strategy', b)); await store.approve(d); assert.equal((await store.readDocument(a)).meta.version, 3);
  await assert.rejects(store.readDocument(a, 2), /Unknown approved revision/); assert.deepEqual(await readFile(orphan), bytes);
});

test('manifest validation rejects duplicate IDs and paths outside managed revisions', async t => {
  const { store, knowledge } = await fixture(t); const { generation } = await seed(store);
  const path = join(knowledge, 'manifests', generation + '.json'); const m = JSON.parse(await readFile(path, 'utf8'));
  await writeFile(path, JSON.stringify({ ...m, entries: [m.entries[0], m.entries[0]] }));
  await assert.rejects(store.list(), /Duplicate manifest ID/);
  await writeFile(path, JSON.stringify({ ...m, entries: [{ ...m.entries[0], path: '../../outside.md' }] }));
  await assert.rejects(store.list(), /Invalid manifest path/);
});
test('failure at selection replacement leaves unselected manifest unreachable', { skip: process.platform === 'win32' || process.getuid?.() === 0 }, async t => {
  const { store, root, settings, knowledge } = await fixture(t); const { id } = await seed(store); const before = await readFile(settings);
  const d = await store.begin(); await store.save(d, { ...sample, id, body: 'New attempt' });
  const parent = join(root, '.content'); await chmod(parent, 0o500);
  try { await assert.rejects(store.approve(d)); assert.deepEqual(await readFile(settings), before); }
  finally { await chmod(parent, 0o700); }
  assert.equal((await readdir(join(knowledge, 'manifests'))).length, 2);
  assert.equal((await store.readDocument(id)).meta.version, 1);
  await store.approve(d); assert.equal((await store.readDocument(id)).meta.version, 3);
  await assert.rejects(store.readDocument(id, 2), /Unknown approved revision/);
  assert.equal((await readdir(join(knowledge, 'manifests'))).length, 3);
});
