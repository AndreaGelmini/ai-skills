import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { init } from '../dist/workspace.js';
import { setup } from '../dist/setup.js';

const complete = { identity: 'Independent developer', objectives: 'Share discoveries', audience: 'Developers', voice: 'Direct', scope: 'Tools and ideas', platforms: ['linkedin'], memory_enabled: false, startup_status: true };
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'setup-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await init(root);
  return root;
}

test('save resumes a partial interview; explicit null means optional declined', async t => {
  const root = await fixture(t);
  await setup(root, 'save', { identity: complete.identity, visual: null });
  const result = await setup(root, 'read');
  assert.equal(result.configuration, 'pending');
  assert.equal(result.profile, null);
  assert.equal(result.draft.identity, complete.identity);
  assert.ok(!result.unaddressed_optional.includes('visual'));
  assert.ok(result.missing.includes('audience'));
  await setup(root, 'save', { audience: 'Developers' });
  assert.equal((await setup(root, 'read')).draft.identity, complete.identity);
});

test('approval refuses incomplete draft and preserves it', async t => {
  const root = await fixture(t);
  await setup(root, 'save', { identity: 'Author' });
  await assert.rejects(setup(root, 'approve'), /Missing required/);
  assert.equal((await setup(root, 'read')).draft.identity, 'Author');
});

test('approved profile remains active during updates', async t => {
  const root = await fixture(t);
  await setup(root, 'save', complete);
  await setup(root, 'approve');
  await setup(root, 'save', { voice: 'Conversational' });
  const pending = await setup(root, 'read');
  assert.equal(pending.configuration, 'approved');
  assert.equal(pending.profile.voice, 'Direct');
  assert.equal(pending.draft.voice, 'Conversational');
  const approved = await setup(root, 'approve');
  assert.equal(approved.profile.voice, 'Conversational');
  assert.equal(approved.draft, null);
  assert.equal(approved.profile.memory_enabled, false);
});

test('rejects invalid patches without writing; preserves unrelated settings', async t => {
  const root = await fixture(t);
  const path = join(root, '.content/settings.json');
  const original = { schema_version: 1, configuration: 'pending', custom: 'keep' };
  await writeFile(path, JSON.stringify(original));
  for (const patch of [{ identity: '' }, { platforms: [] }, { memory_enabled: 'true' }, { memory_support_threshold: 0 }, { configuration: 'approved' }]) {
    await assert.rejects(setup(root, 'save', patch));
    assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), original);
  }
  await setup(root, 'save', complete);
  await setup(root, 'approve');
  assert.equal(JSON.parse(await readFile(path, 'utf8')).custom, 'keep');
});

test('setup rejects uninitialized workspace', async t => {
  const root = await fixture(t);
  await assert.rejects(setup(join(root, 'absent'), 'read'), /Workspace not ready/);
});

test('CLI supports stdin patch and explicit approval', async t => {
  const root = await fixture(t);
  const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
  const run = (action, input) => spawnSync(process.execPath, [cli, 'setup', action], { cwd: root, encoding: 'utf8', input });
  assert.equal(run('save', JSON.stringify(complete)).status, 0);
  assert.equal(run('approve').status, 0);
  assert.equal(JSON.parse(run('read').stdout).profile.identity, complete.identity);
  assert.equal(run('save', 'broken').status, 2);
});


test('memory defaults are exposed and applied only for enabled memory; explicit threshold wins', async t => {
  const root = await fixture(t);
  const initial = await setup(root, 'read');
  assert.deepEqual(initial.defaults, { memory_support_threshold: 5, memory_contrary_threshold: 10 });
  await setup(root, 'save', { ...complete, memory_enabled: true, memory_support_threshold: 7, visual: null });
  const saved = await setup(root, 'read');
  assert.ok(!saved.unaddressed_optional.includes('visual'));
  assert.ok(saved.unaddressed_optional.includes('examples'));
  const approved = await setup(root, 'approve');
  assert.equal(approved.profile.memory_support_threshold, 7);
  assert.equal(approved.profile.memory_contrary_threshold, 10);
  assert.equal(approved.profile.visual, null);
  assert.ok(!Object.hasOwn(approved.profile, 'examples'));
});

test('memory branch is blocked, excluded or open according to its prerequisite', async t => {
  const root = await fixture(t);
  const keys = ['memory_support_threshold', 'memory_contrary_threshold'];
  const initial = await setup(root, 'read');
  assert.deepEqual(initial.optional_dependencies, Object.fromEntries(keys.map(key => [key, { memory_enabled: true }])));
  assert.deepEqual(initial.blocked_optional, keys);
  assert.deepEqual(initial.inapplicable_optional, []);
  assert.ok(keys.every(key => !initial.unaddressed_optional.includes(key)));
  const disabled = await setup(root, 'save', { memory_enabled: false });
  assert.deepEqual(disabled.blocked_optional, []);
  assert.deepEqual(disabled.inapplicable_optional, keys);
  assert.ok(keys.every(key => !disabled.unaddressed_optional.includes(key)));
  const enabled = await setup(root, 'save', { memory_enabled: true });
  assert.deepEqual(enabled.blocked_optional, []);
  assert.deepEqual(enabled.inapplicable_optional, []);
  assert.ok(keys.every(key => enabled.unaddressed_optional.includes(key)));
});

test('closing and reopening the memory branch preserves confirmed thresholds and active profile', async t => {
  const root = await fixture(t);
  await setup(root, 'save', { ...complete, memory_enabled: true, memory_support_threshold: 7 });
  await setup(root, 'approve');
  const disabled = await setup(root, 'save', { memory_enabled: false });
  assert.equal(disabled.profile.memory_enabled, true);
  assert.equal(disabled.draft.memory_support_threshold, 7);
  assert.ok(disabled.inapplicable_optional.includes('memory_support_threshold'));
  const reopened = await setup(root, 'save', { memory_enabled: true });
  assert.equal(reopened.draft.memory_support_threshold, 7);
  assert.ok(!reopened.unaddressed_optional.includes('memory_support_threshold'));
  assert.deepEqual(reopened.inapplicable_optional, []);
});
