import { expect, test, vi } from "vitest";
import variables from "./coc";
import { window, workspace } from "coc.nvim";

vi.mock("coc.nvim", () => ({
  Uri: { parse: (uri: string) => ({ fsPath: decodeURIComponent(new URL(uri).pathname) }) },
  workspace: {
    workspaceFolders: [{ name: "repo", uri: "file:///test/my%20repo" }],
    getConfiguration: () => ({ get: () => "setting" }),
    nvim: { call: vi.fn(async () => "v") },
  },
  window: {
    activeTextEditor: { document: {
      uri: "file:///test/my%20repo/file.ts",
      textDocument: { getText: () => "selected" },
    } },
    getCursorPosition: async () => ({ line: 4, character: 6 }),
    getSelectedRange: vi.fn(async () => ({ start: { line: 4, character: 0 }, end: { line: 4, character: 8 } })),
  },
  commands: { executeCommand: async () => "command" },
}));

test("coc adapter resolves URIs, cursor position, selections, settings and commands", async () => {
  expect(await variables("${workspaceFolder}|${relativeFile}|${lineNumber}:${columnNumber}|${selectedText}|${config:x}|${command:x}"))
    .toBe("/test/my repo|file.ts|5:7|selected|setting|command");
});

test("normal mode has no selected text", async () => {
  vi.mocked(workspace.nvim.call).mockResolvedValueOnce("n");
  expect(await variables("${selectedText}")).toBe("");
});

test("missing editor resolves file and cursor variables safely", async () => {
  vi.spyOn(window, "activeTextEditor", "get").mockReturnValueOnce(undefined);
  expect(await variables("${file}|${lineNumber}|${columnNumber}|${selectedText}")) .toBe("|0|0|");
});
