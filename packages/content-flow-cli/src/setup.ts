import { lstat, readFile, writeFile, rename, mkdtemp, rm, chmod } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { check } from './workspace.js';

const requiredText = ['identity', 'objectives', 'audience', 'voice', 'scope'] as const;
const optionalText = ['rubrics', 'examples', 'visual', 'platform_preferences', 'locale', 'cadence', 'tools'] as const;
const flags = ['memory_enabled', 'startup_status'] as const;
const memoryDefaults = { memory_support_threshold: 5, memory_contrary_threshold: 10 } as const;
const thresholds = ['memory_support_threshold', 'memory_contrary_threshold'] as const;
const required = [...requiredText, 'platforms', ...flags];
const optional = [...optionalText, ...thresholds];
const optionalDependencies = Object.fromEntries(thresholds.map(key => [key, { memory_enabled: true }]));
type RecordData = Record<string, unknown>;
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
function object(value: unknown): value is RecordData {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validate(value: unknown): asserts value is RecordData {
  if (!object(value)) throw new Error('Expected a setup object');
  for (const [key, field] of Object.entries(value)) {
    if ((requiredText as readonly string[]).includes(key)) {
      if (!nonempty(field)) throw new Error(`${key}: expected nonempty text`);
    } else if ((optionalText as readonly string[]).includes(key)) {
      if (field !== null && !nonempty(field)) throw new Error(`${key}: expected nonempty text or null`);
    } else if (key === 'platforms') {
      if (!Array.isArray(field) || !field.length || !field.every(nonempty)) throw new Error('platforms: expected nonempty list of destinations');
    } else if ((flags as readonly string[]).includes(key)) {
      if (typeof field !== 'boolean') throw new Error(`${key}: expected boolean`);
    } else if ((thresholds as readonly string[]).includes(key)) {
      if (field !== null && (typeof field !== 'number' || !Number.isSafeInteger(field) || field < 1)) throw new Error(`${key}: expected positive integer or null`);
    } else {
      throw new Error(`Unknown setup field: ${key}`);
    }
  }
}

const missing = (profile: RecordData) => required.filter(key => !Object.hasOwn(profile, key));

async function load(workspace: string) {
  const preflight = await check(workspace);
  if (preflight.status !== 'ok') throw new Error(`Workspace not ready: ${JSON.stringify(preflight)}`);
  const path = join(resolve(workspace), '.content', 'settings.json');
  const settings: RecordData = JSON.parse(await readFile(path, 'utf8'));
  if (settings.profile !== undefined) validate(settings.profile);
  if (settings.setup_draft !== undefined) validate(settings.setup_draft);
  return { path, settings };
}

function view(settings: RecordData) {
  const profile = (settings.profile ?? null) as RecordData | null;
  const draft = (settings.setup_draft ?? null) as RecordData | null;
  const candidate = draft ?? profile ?? {};
  const blocked: readonly string[] = candidate.memory_enabled === undefined ? thresholds : [];
  const inapplicable: readonly string[] = candidate.memory_enabled === false ? thresholds : [];
  return {
    status: 'ok', configuration: settings.configuration,
    profile, draft, required, optional, defaults: memoryDefaults,
    missing: missing(candidate),
    optional_dependencies: optionalDependencies,
    blocked_optional: blocked,
    inapplicable_optional: inapplicable,
    unaddressed_optional: optional.filter(key => !Object.hasOwn(candidate, key) && !blocked.includes(key) && !inapplicable.includes(key)),
  };
}

async function persist(path: string, settings: RecordData) {
  const parent = join(path, '..');
  const existing = await lstat(path);
  if (!(await lstat(parent)).isDirectory() || !existing.isFile()) throw new Error('Invalid settings path');
  const dir = await mkdtemp(join(parent, '.setup-'));
  try {
    const temp = join(dir, 'settings.json');
    await writeFile(temp, JSON.stringify(settings, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    await chmod(temp, existing.mode & 0o777);
    await rename(temp, path);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function setup(workspace: string, action: string, input?: unknown) {
  const { path, settings } = await load(workspace);
  if (action === 'read') return view(settings);
  if (action === 'save') {
    validate(input);
    if (!Object.keys(input).length) throw new Error('Empty setup patch');
    settings.setup_draft = { ...(settings.setup_draft ?? settings.profile ?? {}) as RecordData, ...input };
  } else if (action === 'approve') {
    if (!object(settings.setup_draft)) throw new Error('No setup draft to approve');
    const gaps = missing(settings.setup_draft);
    if (gaps.length) throw new Error(`Missing required setup fields: ${gaps.join(', ')}`);
    const candidate = { ...settings.setup_draft };
    if (candidate.memory_enabled === true) {
      for (const key of thresholds) candidate[key] ??= memoryDefaults[key];
    }
    settings.profile = candidate;
    settings.configuration = 'approved';
    delete settings.setup_draft;
  } else {
    throw new Error('Expected setup read, save or approve');
  }
  await persist(path, settings);
  return view(settings);
}
