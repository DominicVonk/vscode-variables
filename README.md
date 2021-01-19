# VSCode Predefined Variable Parser

Predefined variables
The following predefined variables are supported:

`${workspaceFolder}` - the path of the folder opened in VS Code  
`${workspaceFolderBasename}` - the name of the folder opened in VS Code without any slashes (/)  
`${file}` - the current opened file  
`${fileWorkspaceFolder}` - the current opened file's workspace folder  
`${relativeFile}` - the current opened file relative to workspaceFolder  
`${relativeFileDirname}` - the current opened file's dirname relative to workspaceFolder  
`${fileBasename}` - the current opened file's   
`${fileBasenameNoExtension}` - the current opened file's basename with no file extension  
`${fileDirname}` - the current opened file's dirname  
`${fileExtname}` - the current opened file's extension  
`${cwd}` - the task runner's current working directory on startup  
`${lineNumber}` - the current selected line number in the active file  
`${selectedText}` - the current selected text in the active file  
`${pathSeparator}` - the character used by the operating system to separate components in file paths  
`${env:<variable>}` - return the env variable  
`${config:<variable>}` - return the settings configuration


## Install the package:
```npm i -S vscode-variables```

## Using the package
### Once
```js
const vscodeVariables = require('vscode-variables');

vscodeVariables('${file}'); //will return the fsPath of the file.
```
### Recursive

```js
const vscodeVariables = require('vscode-variables');

vscodeVariables('${file}',true); //will return the fsPath of the file.
```