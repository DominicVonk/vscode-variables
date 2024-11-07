import * as os from "os";
import * as process from "process";
import * as vscode from "vscode";
module.exports = function variables(string: string, recursive = false) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const activeFile = vscode.window.activeTextEditor?.document;
  const absoluteFilePath = activeFile?.uri.fsPath;
  const workspace = vscode.workspace.workspaceFolders?.[0];
  const activeWorkspace = workspaceFolders?.find((workspace) =>
    absoluteFilePath?.startsWith(workspace.uri.fsPath)
  )?.uri.fsPath;
  const homeDir = os.homedir();

  // ${userHome} - /home/your-username
  string = string.replace(/\${userHome}/g, homeDir);

  // ${workspaceFolder} - /home/your-username/your-project
  string = string.replace(/\${workspaceFolder}/g, workspace?.uri.fsPath ?? "");

  // ${workspaceFolder:name} - /home/your-username/your-project2
  string = string.replace(/\${workspaceFolder:(.*?)}/g, function (_, name) {
    return (
      workspaceFolders?.find((workspace) => workspace.name === name)?.uri
        .fsPath ?? ""
    );
  });

  // ${workspaceFolderBasename} - your-project
  string = string.replace(
    /\${workspaceFolderBasename}/g,
    workspace?.name ?? ""
  );

  // ${workspaceFolderBasename:name} - your-project2
  string = string.replace(
    /\${workspaceFolderBasename:(.*?)}/g,
    function (_, name) {
      return (
        workspaceFolders?.find((workspace) => workspace.name === name)?.name ??
        ""
      );
    }
  );

  // ${file} - /home/your-username/your-project/folder/file.ext
  string = string.replace(/\${file}/g, absoluteFilePath ?? "");

  // ${fileWorkspaceFolder} - /home/your-username/your-project
  string = string.replace(/\${fileWorkspaceFolder}/g, activeWorkspace ?? "");

  // ${relativeFile} - folder/file.ext
  string = string.replace(
    /\${relativeFile}/g,
    absoluteFilePath?.substring(activeWorkspace?.length ?? 0) ?? ""
  );

  // ${relativeFileDirname} - folder
  string = string.replace(
    /\${relativeFileDirname}/g,
    absoluteFilePath?.substring(
      activeWorkspace?.length ?? 0,
      absoluteFilePath?.lastIndexOf(os.platform() === "win32" ? "\\" : "/")
    ) ?? ""
  );

  // ${fileBasename} - file.ext
  string = string.replace(
    /\${fileBasename}/g,
    absoluteFilePath?.split("/")?.pop() ?? ""
  );

  // ${fileBasenameNoExtension} - file
  string = string.replace(
    /\${fileBasenameNoExtension}/g,
    absoluteFilePath?.split("/").pop()?.split(".")?.shift() ?? ""
  );
  // ${fileDirname} - /home/your-username/your-project/folder
  string = string.replace(
    /\${fileDirname}/g,
    absoluteFilePath?.split("/")?.slice(0, -1)?.join("/") ?? ""
  );

  // ${fileExtname} - .ext
  string = string.replace(
    /\${fileExtname}/g,
    absoluteFilePath?.split(".")?.pop() ?? ""
  );

  // ${lineNumber} - line number of the cursor
  string = string.replace(
    /\${lineNumber}/g,
    (vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.selection.start.line + 1
      : 0
    ).toString()
  );

  // ${selectedText} - text selected in your code editor
  string = string.replace(/\${selectedText}/g, function () {
    return (
      vscode.window.activeTextEditor?.document.getText(
        new vscode.Range(
          vscode.window.activeTextEditor.selection.start,
          vscode.window.activeTextEditor.selection.end
        )
      ) ?? ""
    );
  });

  // ${execPath} - location of Code.exe
  string = string.replace(/\${execPath}/g, process.execPath);

  // ${pathSeparator} - / on macOS or linux, \ on Windows
  string = string.replace(
    /\${pathSeparator}/g,
    os.platform() === "win32" ? "\\" : "/"
  );

  // ${/} - short for ${pathSeparator}
  string = string.replace(/\${\/}/g, os.platform() === "win32" ? "\\" : "/");

  // ${env:VARIABLE} - environment variable
  string = string.replace(/\${env:(.*?)}/g, function (variable, _) {
    return process.env[_] || "";
  });

  // ${config:VARIABLE} - configuration variable
  string = string.replace(/\${config:(.*?)}/g, function (variable, _) {
    return vscode.workspace.getConfiguration().get(_, "");
  });

  if (
    recursive &&
    string.match(
      /\${(workspaceFolder|workspaceFolder:(.*?)|workspaceFolderBase:(.*?)|workspaceFolderBasename|fileWorkspaceFolder|relativeFile|fileBasename|fileBasenameNoExtension|fileExtname|fileDirname|cwd|pathSeparator|lineNumber|selectedText|env:(.*?)|config:(.*?)|userHome)}/
    )
  ) {
    string = variables(string, recursive);
  }
  return string;
};
