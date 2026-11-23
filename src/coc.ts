import { commands, Uri, window, workspace } from "coc.nvim";
import { variables as parse } from "./parser";

async function variables(input: string, recursive = false): Promise<string> {
  const editor = window.activeTextEditor;
  const cursor = editor ? await window.getCursorPosition() : undefined;
  return parse({
    workspaceFolders: workspace.workspaceFolders.map((folder) => ({
      name: folder.name,
      uri: { fsPath: Uri.parse(folder.uri).fsPath },
    })),
    absoluteFilePath: editor ? Uri.parse(editor.document.uri).fsPath : undefined,
    lineNumber: cursor ? cursor.line + 1 : 0,
    columnNumber: cursor ? cursor.character + 1 : 0,
    selectedText: async () => {
      if (!editor) return "";
      const mode = await workspace.nvim.call("mode");
      if (mode !== "v" && mode !== "V" && mode !== "\u0016") return "";
      // coc's getSelectedRange reads the previous selection marks, not the
      // current visual anchor. getregion also handles block and Unicode text.
      const lines: unknown = await workspace.nvim.eval(
        "getregion(getpos('v'), getpos('.'), {'type': mode()})"
      );
      if (!Array.isArray(lines) || !lines.every((line: unknown) => typeof line === "string")) {
        throw new Error("Editor returned an invalid visual selection");
      }
      return lines.join("\n") + (mode === "V" ? "\n" : "");
    },
    configuration: (name) => workspace.getConfiguration().get(name, ""),
    executeCommand: (name) => commands.executeCommand(name),
  }, input, recursive);
}

export = variables;
