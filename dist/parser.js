"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.variables = variables;
const os = require("os");
const process = require("process");
const path = require("path");
async function substitute(context, string) {
    const { workspaceFolders, absoluteFilePath } = context;
    const workspace = workspaceFolders?.[0];
    const paths = os.platform() === "win32" ? path.win32 : path.posix;
    const activeWorkspace = workspaceFolders
        ?.filter((folder) => {
        if (!absoluteFilePath)
            return false;
        const relative = paths.relative(folder.uri.fsPath, absoluteFilePath);
        return relative !== ".." && !relative.startsWith(`..${paths.sep}`) && !paths.isAbsolute(relative);
    })
        .sort((a, b) => b.uri.fsPath.length - a.uri.fsPath.length)[0]?.uri.fsPath;
    const filename = absoluteFilePath ? paths.basename(absoluteFilePath) : "";
    const dirname = absoluteFilePath ? paths.dirname(absoluteFilePath) : "";
    const extension = paths.extname(filename);
    const relativeFile = absoluteFilePath && activeWorkspace
        ? paths.relative(activeWorkspace, absoluteFilePath) : absoluteFilePath ?? "";
    const homeDir = os.homedir();
    // ${userHome} - /home/your-username
    string = string.replace(/\${userHome}/g, () => homeDir);
    // ${workspaceFolder} - /home/your-username/your-project
    string = string.replace(/\${workspaceFolder}/g, () => workspace?.uri.fsPath ?? "");
    // ${workspaceFolder:name} - /home/your-username/your-project2
    string = string.replace(/\${workspaceFolder:(.*?)}/g, function (_, name) {
        return (workspaceFolders?.find((workspace) => workspace.name === name)?.uri
            .fsPath ?? "");
    });
    // ${workspaceFolderBasename} - your-project
    string = string.replace(/\${workspaceFolderBasename}/g, workspace?.name ?? "");
    // ${workspaceFolderBasename:name} - your-project2
    string = string.replace(/\${workspaceFolderBasename:(.*?)}/g, function (_, name) {
        return (workspaceFolders?.find((workspace) => workspace.name === name)?.name ??
            "");
    });
    // ${file} - /home/your-username/your-project/folder/file.ext
    string = string.replace(/\${file}/g, () => absoluteFilePath ?? "");
    // ${fileWorkspaceFolder} - /home/your-username/your-project
    string = string.replace(/\${fileWorkspaceFolder}/g, () => activeWorkspace ?? "");
    string = string.replace(/\${relativeFile}/g, () => relativeFile);
    string = string.replace(/\${relativeFileDirname}/g, () => relativeFile ? paths.dirname(relativeFile) : "");
    string = string.replace(/\${fileBasename}/g, () => filename);
    string = string.replace(/\${fileBasenameNoExtension}/g, () => paths.basename(filename, extension));
    string = string.replace(/\${fileDirname}/g, () => dirname);
    string = string.replace(/\${fileDirnameBasename}/g, () => dirname ? paths.basename(dirname) : "");
    string = string.replace(/\${fileExtname}/g, () => extension);
    string = string.replace(/\${columnNumber}/g, () => context.columnNumber.toString());
    if (string.includes("${defaultBuildTask}") && context.defaultBuildTask) {
        const task = await context.defaultBuildTask();
        string = string.replace(/\${defaultBuildTask}/g, () => task);
    }
    // ${lineNumber} - line number of the cursor
    string = string.replace(/\${lineNumber}/g, context.lineNumber.toString());
    if (string.includes("${selectedText}")) {
        const selectedText = await context.selectedText();
        string = string.replace(/\${selectedText}/g, () => selectedText);
    }
    // Extension-host working directory; no enclosing task configuration is available.
    string = string.replace(/\${cwd}/g, () => process.cwd());
    // ${execPath} - location of Code.exe
    string = string.replace(/\${execPath}/g, process.execPath);
    // ${pathSeparator} - / on macOS or linux, \ on Windows
    string = string.replace(/\${pathSeparator}/g, os.platform() === "win32" ? "\\" : "/");
    // ${/} - short for ${pathSeparator}
    string = string.replace(/\${\/}/g, os.platform() === "win32" ? "\\" : "/");
    // ${env:VARIABLE} - environment variable
    string = string.replace(/\${env:(.*?)}/g, function (variable, _) {
        return process.env[_] || "";
    });
    // ${config:VARIABLE} - configuration variable
    string = string.replace(/\${config:(.*?)}/g, function (variable, _) {
        return context.configuration(_);
    });
    const commands = new Map();
    for (const match of string.matchAll(/\${command:(.*?)}/g)) {
        const name = match[1];
        if (!commands.has(name)) {
            // Preserve the package's existing empty-result behavior on command failure.
            try {
                const result = await context.executeCommand(name);
                commands.set(name, result === undefined ? "" : String(result));
            }
            catch {
                commands.set(name, "");
            }
        }
    }
    string = string.replace(/\${command:(.*?)}/g, (_, name) => commands.get(name) ?? "");
    return string;
}
async function variables(context, input, recursive = false) {
    const seen = new Set();
    let result = input;
    for (let depth = 0; depth < 100; depth++) {
        if (seen.has(result))
            throw new Error("Circular variable substitution");
        seen.add(result);
        const next = await substitute(context, result);
        if (!recursive || next === result)
            return next;
        result = next;
    }
    throw new Error("Variable substitution exceeded 100 passes");
}
