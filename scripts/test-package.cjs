// Check the actual tarball, independent of the source imports used by Vitest.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-variables-package-'));
const originalLoad = Module._load;
(async () => {
  try {
    const output = execFileSync('npm', ['pack', '--json', '--pack-destination', directory], { encoding: 'utf8' });
    const [packed] = JSON.parse(output);
    execFileSync('tar', ['-xzf', path.join(directory, packed.filename), '-C', directory]);
    const root = path.join(directory, 'package');
    const metadata = require(path.join(root, 'package.json'));
    const editor = { document: { uri: { fsPath: '/repo/file.ts' } }, selection: { start: { line: 0, character: 0 } } };
    const imports = [];
    Module._load = function (name, ...args) {
      if (name === 'vscode') {
        imports.push(name);
        return { workspace: {}, window: { activeTextEditor: editor } };
      }
      if (name === 'coc.nvim') {
        imports.push(name);
        return { workspace: { workspaceFolders: [] }, window: {} };
      }
      return originalLoad.call(this, name, ...args);
    };
    const variables = require(path.join(root, metadata.main));
    assert.equal(typeof variables, 'function');
    assert.equal(await variables('${file}'), '/repo/file.ts');
    assert.deepEqual(imports, ['vscode']);
    imports.length = 0;
    const coc = require(path.join(root, metadata.exports['./coc'].default));
    assert.equal(typeof coc, 'function');
    assert.equal(await coc('${file}'), '');
    assert.deepEqual(imports, ['coc.nvim']);
    for (const entry of ['.', './coc']) {
      assert.match(fs.readFileSync(path.join(root, metadata.exports[entry].types), 'utf8'), /export = variables/);
    }
    console.log('Packed CommonJS entry points, editor isolation and declarations passed');
  } finally {
    Module._load = originalLoad;
    fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
