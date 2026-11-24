#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { check, init } from './workspace.js';

try {
  const { values, positionals } = parseArgs({
    options: { workspace: { type: 'string' }, help: { type: 'boolean', short: 'h' } },
    allowPositionals: true,
  });
  if (values.help) {
    console.log('Usage: content-flow <check|init> [--workspace PATH]');
  } else {
    const [command] = positionals;
    if (positionals.length !== 1 || (command !== 'check' && command !== 'init')) {
      throw new Error('Expected exactly one command: check or init');
    }
    if (values.workspace === '') throw new Error('Workspace path cannot be empty');
    const result = await (command === 'check' ? check : init)(values.workspace ?? process.cwd());
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.status === 'ok' ? 0 : result.status === 'incomplete' ? 1 : 2;
  }
} catch (error) {
  console.log(JSON.stringify({ status: 'error', configuration: null, missing: [], created: [], warnings: [], errors: [{ path: '.', message: error instanceof Error ? error.message : String(error) }] }, null, 2));
  process.exitCode = 2;
}
