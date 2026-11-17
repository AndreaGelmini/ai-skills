#!/usr/bin/env node
/** Repeatable Imejis rendering. Run `--dry-run` before a live request.
 *  Rendering consumes monthly quota; check it in MCP beforehand.
 *  No third-party dependencies; Node.js 22+ recommended.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join, basename, relative, sep } from 'node:path';
import { cwd, env, exit } from 'node:process';

function argument(name) {
  const idx = process.argv.indexOf(name);
  return idx < 0 ? null : process.argv[idx + 1] ?? null;
}
function requireValue(name) {
  const value = argument(name);
  if (!value) throw Error(`${name} is required`);
  return value;
}
function safeFilename(name) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(png|jpe?g|webp)$/i.test(name) || name.includes('..'))
    throw Error(`Invalid filename: ${name}`);
  return basename(name);
}
function targetDirectory(input) {
  const project = cwd();
  const path = resolve(project, input);
  const rel = relative(project, path);
  if (rel.startsWith('..' + sep) || rel === '..' || rel.startsWith(sep) ||
      !(rel === '.imejis' || rel.startsWith('.imejis' + sep)))
    throw Error('Output directory must be within the project .imejis/ directory');
  return path;
}
function outputExtension(contentType) {
  if (/image\/png/i.test(contentType)) return '.png';
  if (/image\/jpeg/i.test(contentType)) return '.jpg';
  if (/image\/webp/i.test(contentType)) return '.webp';
  throw Error(`Unexpected response content type: ${contentType}`);
}

async function main() {
  const input = requireValue('--jobs');
  const dir = targetDirectory(requireValue('--out'));
  const dry = process.argv.includes('--dry-run');
  const data = JSON.parse(await readFile(input, 'utf8'));
  if (!Array.isArray(data.jobs) || data.jobs.length === 0)
    throw Error('jobs must be a nonempty array');
  const names = new Set();
  for (const job of data.jobs) {
    if (!job || typeof job.designId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(job.designId))
      throw Error('Each designId must be a verified non-empty Imejis design ID');
    if (!job.fields || typeof job.fields !== 'object' || Array.isArray(job.fields))
      throw Error('Each job must have fields object with verified keys');
    const filename = safeFilename(job.filename);
    if (names.has(filename)) throw Error(`Duplicate output filename: ${filename}`);
    names.add(filename);
  }
  if (dry) {
    console.log(JSON.stringify({dryRun: true, plannedRenders: data.jobs.length, outputDir: dir, files: [...names]}, null, 2));
    return;
  }
  const approved = Number(requireValue('--approved-renders'));
  if (!Number.isSafeInteger(approved) || approved < data.jobs.length || approved < 1)
    throw Error('Approved render count must cover all jobs. Check MCP quota and costs first.');
  const apiKey = env.IMEJIS_API_KEY;
  if (!apiKey) throw Error('Set IMEJIS_API_KEY in environment; never put it in the jobs file');
  await mkdir(dir, {recursive: true});
  const records = [];
  for (const job of data.jobs) {
    const record = {designId: job.designId, filename: job.filename, status: 'failed'};
    try {
      const response = await fetch(`https://render.imejis.io/v1/${encodeURIComponent(job.designId)}`, {
        method: 'POST',
        headers: {'dma-api-key': apiKey, 'Content-Type': 'application/json'},
        body: JSON.stringify(job.fields),
        signal: AbortSignal.timeout(60000)
      });
      if (!response.ok) throw Error(`Render endpoint returned HTTP ${response.status}`);
      const type = response.headers.get('content-type') ?? '';
      const actualExtension = outputExtension(type);
      const ext = '.' + job.filename.split('.').pop().toLowerCase();
      if (ext !== actualExtension && !(ext === '.jpeg' && actualExtension === '.jpg'))
        throw Error(`Filename extension ${ext} does not match response ${type}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length) throw Error('Empty image response');
      await writeFile(join(dir, job.filename), bytes, {flag:'wx'});
      record.status = 'saved';
      record.bytes = bytes.length;
    } catch (err) {
      record.error = String(err.message ?? err);
    }
    records.push(record);
  }
  const manifest = {createdAt: new Date().toISOString(), attemptedRenders: records.length, records};
  const manifestPath = join(dir, 'render-manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest,null,2) + '\n', {flag:'wx'});
  console.log(JSON.stringify(manifest,null,2));
  if (records.some(row => row.status !== 'saved')) exit(1);
}
main().catch(err => { console.error(err.message); exit(1); });
