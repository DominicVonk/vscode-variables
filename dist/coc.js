"use strict";
const coc_nvim_1 = require("coc.nvim");
const parser_1 = require("./parser");
async function variables(input, recursive = false) {
    const editor = coc_nvim_1.window.activeTextEditor;
    const cursor = editor ? await coc_nvim_1.window.getCursorPosition() : undefined;
    return (0, parser_1.variables)({
        workspaceFolders: coc_nvim_1.workspace.workspaceFolders.map((folder) => ({
            name: folder.name,
            uri: { fsPath: coc_nvim_1.Uri.parse(folder.uri).fsPath },
        })),
        absoluteFilePath: editor ? coc_nvim_1.Uri.parse(editor.document.uri).fsPath : undefined,
        lineNumber: cursor ? cursor.line + 1 : 0,
        columnNumber: cursor ? cursor.character + 1 : 0,
        selectedText: async () => {
            if (!editor)
                return "";
            const mode = await coc_nvim_1.workspace.nvim.call("mode");
            if (mode !== "v" && mode !== "V" && mode !== "\u0016")
                return "";
            const range = await coc_nvim_1.window.getSelectedRange(mode);
            return range ? editor.document.textDocument.getText(range) : "";
        },
        configuration: (name) => coc_nvim_1.workspace.getConfiguration().get(name, ""),
        executeCommand: (name) => coc_nvim_1.commands.executeCommand(name),
    }, input, recursive);
}
module.exports = variables;
