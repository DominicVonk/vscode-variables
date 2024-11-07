import { describe, expect, test, vi } from "vitest";
// @ts-expect-error
import variables from "./index";

vi.mock("vscode", () => ({
  workspace: {
    workspaceFolders: [
      {
        uri: { fsPath: "/test/workspace" },
        name: "workspace",
      },
      {
        uri: { fsPath: "/test/workspace2" },
        name: "workspace2",
      },
    ],
    getConfiguration: () => ({
      get: () => "test-config",
    }),
  },
  window: {
    activeTextEditor: {
      document: {
        uri: { fsPath: "/test/workspace/file.txt" },
        getText: () => "selected text",
      },
      selection: {
        start: { line: 0 },
        end: { line: 0 },
      },
    },
  },
  Range: class {
    constructor() {}
  },
  commands: {
    executeCommand: vi.fn((command) => {
      if (command === "testCommand") {
        return "commandResult";
      }
      throw new Error("Command not found");
    }),
  },
}));

vi.mock("os", () => ({
  homedir: () => "/home/user",
  platform: () => "linux",
}));

vi.mock("process", () => ({
  execPath: "/usr/bin/code",
  env: {
    TEST_VAR: "test-value",
  },
}));

describe("variables", () => {
  test("replaces ${userHome}", async () => {
    expect(await variables("${userHome}")).toBe("/home/user");
  });

  test("replaces ${workspaceFolder}", async () => {
    expect(await variables("${workspaceFolder}")).toBe("/test/workspace");
  });

  test("replaces ${workspaceFolder:name}", async () => {
    expect(await variables("${workspaceFolder:workspace2}")).toBe(
      "/test/workspace2"
    );
  });

  test("replaces ${workspaceFolderBasename}", async () => {
    expect(await variables("${workspaceFolderBasename}")).toBe("workspace");
  });

  test("replaces ${file}", async () => {
    expect(await variables("${file}")).toBe("/test/workspace/file.txt");
  });

  test("replaces ${fileBasename}", async () => {
    expect(await variables("${fileBasename}")).toBe("file.txt");
  });

  test("replaces ${fileBasenameNoExtension}", async () => {
    expect(await variables("${fileBasenameNoExtension}")).toBe("file");
  });

  test("replaces ${fileExtname}", async () => {
    expect(await variables("${fileExtname}")).toBe("txt");
  });

  test("replaces ${execPath}", async () => {
    expect(await variables("${execPath}")).toBe("/usr/bin/code");
  });

  test("replaces ${pathSeparator}", async () => {
    expect(await variables("${pathSeparator}")).toBe("/");
  });

  test("replaces ${env:VAR}", async () => {
    expect(await variables("${env:TEST_VAR}")).toBe("test-value");
  });

  test("replaces ${config:setting}", async () => {
    expect(await variables("${config:test}")).toBe("test-config");
  });

  test("handles recursive replacements", async () => {
    expect(await variables("${workspaceFolder}/${fileBasename}", true)).toBe(
      "/test/workspace/file.txt"
    );
  });

  test("replaces ${command:commandName}", async () => {
    expect(await variables("${command:testCommand}")).toBe("commandResult");
  });

  test("handles unknown command in ${command:commandName}", async () => {
    expect(await variables("${command:unknownCommand}")).toBe("");
  });
});
