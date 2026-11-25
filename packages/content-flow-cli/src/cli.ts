#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { check, init } from './workspace.js';
import { setup } from './setup.js';

async function stdinJson(): Promise<unknown> {
  let text = '';
  for await (const chunk of process.stdin) text += chunk;
  return JSON.parse(text);
}

try {
  const { values, positionals } = parseArgs({
    options: { workspace: { type: 'string' }, help: { type: 'boolean', short: 'h' } },
    allowPositionals: true,
  });
  if (values.help) {
    console.log('Usage: content-flow <check|init|setup read|setup save|setup approve> [--workspace PATH]');
  } else {
    const [command, action] = positionals;
    const basic = positionals.length === 1 && (command === 'check' || command === 'init');
    const configuration = positionals.length === 2 && command === 'setup' && ['read', 'save', 'approve'].includes(action);
    if (!basic && !configuration) throw new Error('Expected check, init or setup read|save|approve');
    if (values.workspace === '') throw new Error('Workspace path cannot be empty');
    const workspace = values.workspace ?? process.cwd();
    const result = configuration
      ? await setup(workspace, action, action === 'save' ? await stdinJson() : undefined)
      : await (command === 'check' ? check : init)(workspace);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.status === 'ok' ? 0 : result.status === 'incomplete' ? 1 : 2;
  }
} catch (error) {
  console.log(JSON.stringify({ status: 'error', configuration: null, missing: [], created: [], warnings: [], errors: [{ path: '.', message: error instanceof Error ? error.message : String(error) }] }, null, 2));
  process.exitCode = 2;
}
