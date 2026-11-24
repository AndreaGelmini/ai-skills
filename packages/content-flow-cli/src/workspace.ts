import { constants } from 'node:fs';
import { access, lstat, readFile, mkdir, mkdtemp, writeFile, link, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const layout = [
  { path: '.content', kind: 'directory' },
  { path: '.content/settings.json', kind: 'file' },
  { path: 'ideas', kind: 'directory' },
] as const;
const defaults = { schema_version: 1, configuration: 'pending' } as const;
type Configuration = 'pending' | 'approved' | null;
type Issue = { path: string; message: string };
export type Report = {
  status: 'ok' | 'incomplete' | 'error';
  configuration: Configuration;
  missing: string[];
  created: string[];
  warnings: Issue[];
  errors: Issue[];
};

function code(error: unknown): string | undefined {
  return (error as NodeJS.ErrnoException)?.code;
}

function report(): Report {
  return { status: 'ok', configuration: null, missing: [], created: [], warnings: [], errors: [] };
}

function fail(result: Report, path: string, error: unknown): void {
  result.errors.push({ path, message: error instanceof Error ? error.message : String(error) });
  result.status = 'error';
}

export async function check(workspace: string): Promise<Report> {
  const root = resolve(workspace);
  const result = report();
  try {
    if (!(await lstat(root)).isDirectory()) throw new Error('Expected a real workspace directory');
    await access(root, constants.R_OK | constants.W_OK | constants.X_OK);
  } catch (error) {
    fail(result, '.', error);
    return result;
  }
  for (const entry of layout) {
    // Never traverse a missing or invalid managed parent.
    if (entry.kind === 'file' && (result.missing.includes('.content') || result.errors.some(e => e.path === '.content'))) {
      if (result.missing.includes('.content')) result.missing.push(entry.path);
      continue;
    }
    const path = join(root, entry.path);
    try {
      const stat = await lstat(path);
      if (entry.kind === 'directory' ? !stat.isDirectory() : !stat.isFile()) {
        throw new Error(`Expected a real ${entry.kind}; symbolic links are not supported`);
      }
      await access(path, constants.R_OK | constants.W_OK | (entry.kind === 'directory' ? constants.X_OK : 0));
      if (entry.kind === 'file') {
        const settings = JSON.parse(await readFile(path, 'utf8'));
        if (settings?.schema_version !== 1) throw new Error('Unsupported or missing settings schema_version');
        if (!['pending', 'approved'].includes(settings.configuration)) throw new Error('Invalid configuration state');
        result.configuration = settings.configuration;
      }
    } catch (error) {
      if (code(error) === 'ENOENT') result.missing.push(entry.path);
      else fail(result, entry.path, error);
    }
  }
  if (!result.errors.length && result.missing.length) result.status = 'incomplete';
  if (result.missing.includes('.content/settings.json') && !result.missing.includes('ideas') && !result.errors.length) {
    result.warnings.push({ path: '.content/settings.json', message: 'Ideas directory exists; missing settings will start as pending, not be reconstructed.' });
  }
  return result;
}

// Write completely before making the new settings visible; link never replaces a target.
async function createSettings(path: string): Promise<void> {
  const temp = await mkdtemp(join(path, '.init-'));
  try {
    const file = join(temp, 'settings.json');
    await writeFile(file, JSON.stringify(defaults, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    await link(file, join(path, 'settings.json'));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

export async function init(workspace: string): Promise<Report> {
  const root = resolve(workspace);
  const before = await check(root);
  if (before.status !== 'incomplete') return before;
  const created: string[] = [];
  let current = '.';
  try {
    for (const entry of layout) {
      if (!before.missing.includes(entry.path)) continue;
      current = entry.path;
      // Recheck managed parent before creating a child.
      if (entry.kind === 'file') {
        if (!(await lstat(join(root, '.content'))).isDirectory()) throw new Error('Invalid settings parent');
        await createSettings(join(root, '.content'));
      } else {
        await mkdir(join(root, entry.path));
      }
      created.push(entry.path);
    }
  } catch (error) {
    const result = await check(root);
    result.created = created;
    fail(result, current, error);
    return result;
  }
  const result = await check(root);
  result.created = created;
  result.warnings.unshift(...before.warnings);
  return result;
}
