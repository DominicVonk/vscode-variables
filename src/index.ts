import * as vscode from "vscode";
import { variables as parse } from "./parser";

async function variables(input: string, recursive = false): Promise<string> {
  const editor = vscode.window.activeTextEditor;
  return parse({
    workspaceFolders: vscode.workspace.workspaceFolders,
    absoluteFilePath: editor?.document.uri.fsPath,
    lineNumber: editor ? editor.selection.start.line + 1 : 0,
    columnNumber: editor ? editor.selection.start.character + 1 : 0,
    defaultBuildTask: async () => {
      const tasks = await vscode.tasks.fetchTasks();
      return tasks.find((task) => task.group?.id === vscode.TaskGroup.Build.id && task.group.isDefault)?.name ?? "";
    },
    selectedText: async () => editor?.document.getText(
      new vscode.Range(editor.selection.start, editor.selection.end)
    ) ?? "",
    configuration: (name) => vscode.workspace.getConfiguration().get(name, ""),
    executeCommand: (name) => vscode.commands.executeCommand(name),
  }, input, recursive);
}

export = variables;
