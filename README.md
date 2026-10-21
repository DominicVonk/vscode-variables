# VSCode Predefined Variable Parser

Replace editor variables in strings from VS Code extensions or coc.nvim extensions.

```sh
npm install vscode-variables
```

## Usage

The parser returns a `Promise<string>`. Call it inside an async function:

```js
const variables = require('vscode-variables');
const file = await variables('${file}');
const nested = await variables('${config:myExtension.path}', true);
```

TypeScript declarations are included:

```ts
import variables = require('vscode-variables');
const file: string = await variables('${file}');
```

Default imports also work with `esModuleInterop` enabled. The existing callable
CommonJS export is preserved.

### coc.nvim (Vim / Neovim)

Inside a coc.nvim extension, use the dedicated entry point:

```js
const variables = require('vscode-variables/coc');
const file = await variables('${file}');
```

```ts
import variables = require('vscode-variables/coc');
```

This is a library for extension authors, not a standalone `CocInstall` extension.
The coc entry point uses coc.nvim's document URIs, actual cursor position and
visual selection range. It does not load VS Code. The main entry point does not
load coc.nvim. Each editor supplies its own API at runtime.

## Variables

Checked against the [VS Code variables reference](https://code.visualstudio.com/docs/reference/variables-reference)
on 21 October 2026.

| Variable | Value |
|---|---|
| `${userHome}` | User's home directory |
| `${workspaceFolder}` | First workspace folder's path |
| `${workspaceFolder:name}` | Named workspace folder's path |
| `${workspaceFolderBasename}` | First workspace folder's name |
| `${workspaceFolderBasename:name}` | Named workspace folder's name |
| `${file}` | Active file's path |
| `${fileWorkspaceFolder}` | Active file's containing workspace path (deepest matching folder) |
| `${relativeFile}` | File path relative to its containing workspace |
| `${relativeFileDirname}` | Relative file's directory (`.` for a workspace-root file) |
| `${fileBasename}` | Filename including extension |
| `${fileBasenameNoExtension}` | Filename without its last extension |
| `${fileExtname}` | Last extension including its leading dot; empty for extensionless files |
| `${fileDirname}` | Active file's directory path |
| `${fileDirnameBasename}` | Active file's directory name |
| `${cwd}` | Extension-host process's current working directory |
| `${lineNumber}` | Cursor's one-based line number; `0` without an editor |
| `${columnNumber}` | Cursor's one-based column number; `0` without an editor |
| `${selectedText}` | Selected text; in coc.nvim, current visual selection or empty outside visual mode |
| `${execPath}` | Running editor host's executable path |
| `${defaultBuildTask}` | VS Code's default build task name; empty if none exists |
| `${pathSeparator}` or `${/}` | Operating system's path separator |
| `${env:VARIABLE}` | Environment variable, or empty if unset |
| `${config:setting}` | Editor configuration value, or empty if unset |
| `${command:commandID}` | Command result; undefined or failed commands become empty strings |

`${defaultBuildTask}` remains unchanged in coc.nvim, which has no VS Code task API.
`${input:id}` and setting-specific variables such as `${dirty}` are not supported;
unknown variables remain unchanged. This library has no enclosing `tasks.json` or
`launch.json` context: workspace selection uses the first folder, `${cwd}` uses
the host process, and commands receive no launch configuration argument.

By default, one substitution pass runs. Passing `true` repeats substitution until
stable, rejecting cycles and expansion beyond 100 passes. A repeated command is
executed once per pass. Unlike VS Code task/debug substitution, recursive expansion
is supported and command results are converted to strings for compatibility.

### Behavior corrections

`${userHome}` is the supported name (the previous README incorrectly said
`${homeDir}`). `${fileExtname}` now includes the leading dot, relative file paths
no longer start with a separator, multi-dot filename stems are preserved, Windows
paths use native path rules, and `${cwd}` no longer returns the active file's directory.

## Development

Use Node.js 22.12 or newer and npm:

```sh
npm ci
npm test
npm run test:types
npm audit
```

`npm pack` and `npm publish` build declarations and JavaScript from source through
`prepack`, keeping the published package up to date.
