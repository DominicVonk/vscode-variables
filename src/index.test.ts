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
  test("replaces ${userHome}", () => {
    expect(variables("${userHome}")).toBe("/home/user");
  });

  test("replaces ${workspaceFolder}", () => {
    expect(variables("${workspaceFolder}")).toBe("/test/workspace");
  });

  test("replaces ${workspaceFolder:name}", () => {
    expect(variables("${workspaceFolder:workspace2}")).toBe("/test/workspace2");
  });

  test("replaces ${workspaceFolderBasename}", () => {
    expect(variables("${workspaceFolderBasename}")).toBe("workspace");
  });

  test("replaces ${file}", () => {
    expect(variables("${file}")).toBe("/test/workspace/file.txt");
  });

  test("replaces ${fileBasename}", () => {
    expect(variables("${fileBasename}")).toBe("file.txt");
  });

  test("replaces ${fileBasenameNoExtension}", () => {
    expect(variables("${fileBasenameNoExtension}")).toBe("file");
  });

  test("replaces ${fileExtname}", () => {
    expect(variables("${fileExtname}")).toBe("txt");
  });

  test("replaces ${execPath}", () => {
    expect(variables("${execPath}")).toBe("/usr/bin/code");
  });

  test("replaces ${pathSeparator}", () => {
    expect(variables("${pathSeparator}")).toBe("/");
  });

  test("replaces ${env:VAR}", () => {
    expect(variables("${env:TEST_VAR}")).toBe("test-value");
  });

  test("replaces ${config:setting}", () => {
    expect(variables("${config:test}")).toBe("test-config");
  });

  test("handles recursive replacements", () => {
    expect(variables("${workspaceFolder}/${fileBasename}", true)).toBe(
      "/test/workspace/file.txt"
    );
  });
});
