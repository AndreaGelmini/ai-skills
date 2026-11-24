import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm, symlink, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { check, init } from '../dist/workspace.js';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'content-flow-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test('check on empty directory is read-only', async t => {
  const root = await fixture(t);
  const result = await check(root);
  assert.equal(result.status, 'incomplete');
  assert.deepEqual(result.missing, ['.content', '.content/settings.json', 'ideas']);
  assert.deepEqual(await readdir(root), []);
});

test('init creates minimum workspace and repeated init preserves approved settings and ideas', async t => {
  const root = await fixture(t);
  const first = await init(root);
  assert.equal(first.status, 'ok');
  assert.equal(first.configuration, 'pending');
  assert.equal(first.created.length, 3);
  const file = join(root, '.content/settings.json');
  const custom = '{"schema_version":1,"configuration":"approved","voice":"personal"}\n';
  await writeFile(file, custom);
  await writeFile(join(root, 'ideas', 'idea.md'), 'keep');
  const second = await init(root);
  assert.equal(second.configuration, 'approved');
  assert.deepEqual(second.created, []);
  assert.equal(await readFile(file, 'utf8'), custom);
  assert.equal(await readFile(join(root, 'ideas', 'idea.md'), 'utf8'), 'keep');
});

test('partial workspace creates only missing paths', async t => {
  const root = await fixture(t);
  await mkdir(join(root, 'ideas'));
  const result = await init(root);
  assert.equal(result.status, 'ok');
  assert.deepEqual(result.created, ['.content', '.content/settings.json']);
  assert.equal(result.warnings.length, 1);
});

for (const content of ['broken', '{"schema_version":2,"configuration":"pending"}', '{"schema_version":1,"configuration":"unknown"}']) {
  test(`invalid settings block init: ${content}`, async t => {
    const root = await fixture(t);
    await mkdir(join(root, '.content'));
    const file = join(root, '.content/settings.json');
    await writeFile(file, content);
    assert.equal((await init(root)).status, 'error');
    assert.equal(await readFile(file, 'utf8'), content);
    assert.deepEqual(await readdir(root), ['.content']);
  });
}

test('file in place of managed directory blocks all creation', async t => {
  const root = await fixture(t);
  await writeFile(join(root, 'ideas'), 'keep');
  assert.equal((await init(root)).status, 'error');
  assert.deepEqual(await readdir(root), ['ideas']);
});

test('managed symlink is rejected without writing target', { skip: process.platform === 'win32' }, async t => {
  const root = await fixture(t);
  const outside = await fixture(t);
  await symlink(outside, join(root, '.content'), 'dir');
  assert.equal((await init(root)).status, 'error');
  assert.deepEqual(await readdir(outside), []);
});

test('missing root is not implicitly created', async t => {
  const root = await fixture(t);
  assert.equal((await init(join(root, 'missing'))).status, 'error');
  assert.deepEqual(await readdir(root), []);
});

test('nonwritable managed directory blocks init', { skip: process.platform === 'win32' || process.getuid?.() === 0 }, async t => {
  const root = await fixture(t);
  const dir = join(root, '.content');
  await mkdir(dir);
  await chmod(dir, 0o500);
  try { assert.equal((await init(root)).status, 'error'); }
  finally { await chmod(dir, 0o700); }
});

test('CLI JSON, cwd, workspace option, exit codes and invalid args', async t => {
  const root = await fixture(t);
  const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });
  const before = run('check');
  assert.equal(before.status, 1);
  assert.equal(JSON.parse(before.stdout).status, 'incomplete');
  const initialized = run('init', '--workspace', root);
  assert.equal(initialized.status, 0);
  assert.equal(JSON.parse(initialized.stdout).configuration, 'pending');
  assert.equal(run('check').status, 0);
  assert.equal(run('unknown').status, 2);
  assert.equal(JSON.parse(run('check', '--bad').stdout).status, 'error');
});
