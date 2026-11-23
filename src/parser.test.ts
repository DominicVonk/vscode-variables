import { describe, expect, test, vi } from "vitest";
import { variables, type EditorContext } from "./parser";
import * as os from "os";

vi.mock("os", async (original) => ({ ...await original<typeof os>(), platform: vi.fn(() => "linux") }));

const context: EditorContext = {
  workspaceFolders: [
    { name: "workspace", uri: { fsPath: "/test/workspace" } },
    { name: "workspace2", uri: { fsPath: "/test/workspace2" } },
  ],
  absoluteFilePath: "/test/workspace2/folder/file.test.ts",
  lineNumber: 3,
  columnNumber: 7,
  selectedText: async () => "$& literal",
  configuration: () => "",
  executeCommand: async () => "result",
};

describe("shared parser", () => {
  test.each([
    ["fileWorkspaceFolder", "/test/workspace2"],
    ["relativeFile", "folder/file.test.ts"],
    ["relativeFileDirname", "folder"],
    ["fileBasenameNoExtension", "file.test"],
    ["fileExtname", ".ts"],
    ["fileDirnameBasename", "folder"],
    ["columnNumber", "7"],
    ["selectedText", "$& literal"],
    ["unknown", "${unknown}"],
  ])("resolves %s", async (name, expected) => {
    expect(await variables(context, `\${${name}}`)).toBe(expected);
  });

  test("supports Windows paths", async () => {
    vi.mocked(os.platform).mockReturnValueOnce("win32");
    expect(await variables({ ...context,
      workspaceFolders: [{ name: "repo", uri: { fsPath: "C:\\repo" } }],
      absoluteFilePath: "C:\\repo\\folder\\file.test.ts",
    }, "${relativeFile}|${fileBasenameNoExtension}|${fileExtname}|${fileDirnameBasename}"))
      .toBe("folder\\file.test.ts|file.test|.ts|folder");
  });

  test("selects the deepest workspace and rejects sibling path prefixes", async () => {
    expect(await variables({ ...context, workspaceFolders: [
      { name: "parent", uri: { fsPath: "/test" } },
      ...context.workspaceFolders ?? [],
    ] }, "${fileWorkspaceFolder}")).toBe("/test/workspace2");
  });

  test("resolves build tasks only when supported", async () => {
    expect(await variables(context, "${defaultBuildTask}")).toBe("${defaultBuildTask}");
    expect(await variables({ ...context, defaultBuildTask: async () => "build" }, "${defaultBuildTask}")).toBe("build");
  });

  test("evaluates repeated commands once and preserves literal replacement text", async () => {
    const executeCommand = vi.fn(async () => "$&");
    expect(await variables({ ...context, executeCommand }, "${command:x}-${command:x}")).toBe("$&-$&");
    expect(executeCommand).toHaveBeenCalledTimes(1);
  });

  test("terminates recursive cycles", async () => {
    const configuration = (name: string) => name === "a" ? "${config:b}" : "${config:a}";
    await expect(variables({ ...context, configuration }, "${config:a}", true)).rejects.toThrow("Circular");
    expect(await variables({ ...context, configuration: () => "${fileBasename}" }, "${config:a}", true)).toBe("file.test.ts");
  });

  test("does not loop when a command returns its own placeholder", async () => {
    expect(await variables({ ...context, executeCommand: async () => "${command:x}" }, "${command:x}", true)).toBe("${command:x}");
  });
});

test.each([
  ["/repo/README", "README|"],
  ["/repo/.gitignore", ".gitignore|"],
  ["/repo/archive.tar.gz", "archive.tar|.gz"],
])("handles extension boundaries for %s", async (absoluteFilePath, expected) => {
  expect(await variables({ ...context, absoluteFilePath }, "${fileBasenameNoExtension}|${fileExtname}")) .toBe(expected);
});
