const {commands, workspace, window} = require('coc.nvim');
const variables = require('vscode-variables/coc');
const assert = require('node:assert/strict');
const fs = require('node:fs');
exports.activate = context => {
  context.subscriptions.push(commands.registerCommand('sandbox.test', async () => {
    const results = [];
    const check = async (name, input, expected, recursive = false) => {
      const actual = await variables(input, recursive);
      results.push({name, actual, expected});
      assert.equal(actual, expected, name);
    };
    try {
      await workspace.document;
      results.push({editor: Boolean(window.activeTextEditor), folders: workspace.workspaceFolders});
      await workspace.nvim.call('cursor', [2, 4]);
      await check('file and workspace', '${file}|${workspaceFolder}|${relativeFile}', '/sandbox/workspace/folder/file.test.ts|/sandbox/workspace|folder/file.test.ts');
      await check('real cursor', '${lineNumber}:${columnNumber}', '2:4');
      await check('path variables', '${fileBasenameNoExtension}|${fileExtname}|${fileDirnameBasename}', 'file.test|.ts|folder');
      await check('normal selection', '${selectedText}', '');
      await workspace.nvim.call('cursor', [1, 1]);
      await workspace.nvim.command('normal! v4l');
      await check('character visual selection', '${selectedText}', 'alpha');
      await workspace.nvim.input('\u001b');
      await workspace.nvim.command('normal! V');
      await check('line visual selection', '${selectedText}', 'alpha beta gamma\n');
      await workspace.nvim.input('\u001b');
      await workspace.nvim.call('cursor', [1, 1]);
      await workspace.nvim.command('execute "normal! \\<C-v>j3l"');
      await check('block visual selection', '${selectedText}', 'alph\nseco');
      await workspace.nvim.input('\u001b');
      await workspace.nvim.call('cursor', [3, 1]);
      await workspace.nvim.command('normal! v1l');
      await check('Unicode visual selection', '${selectedText}', 'hé');
      await workspace.nvim.input('\u001b');
      await workspace.nvim.call('cursor', [1, 5]);
      await workspace.nvim.command('normal! v4h');
      await check('backwards visual selection', '${selectedText}', 'alpha');
      await workspace.nvim.input('\u001b');
      await workspace.getConfiguration('sandbox').update('value', '${fileBasename}', true);
      await check('configuration and recursive expansion', '${config:sandbox.value}', 'file.test.ts', true);
      context.subscriptions.push(commands.registerCommand('sandbox.value', () => 'real-command'));
      await check('command', '${command:sandbox.value}', 'real-command');
      await check('unsupported task variable', '${defaultBuildTask}', '${defaultBuildTask}');
      fs.writeFileSync('/sandbox/result.json', JSON.stringify({passed:true, results}, null, 2));
    } catch (error) {
      fs.writeFileSync('/sandbox/result.json', JSON.stringify({passed:false, error:error.stack, results}, null, 2));
    } finally {
      await workspace.nvim.command('qa!');
    }
  }));
};
