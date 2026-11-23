import variables = require("vscode-variables");
import cocVariables = require("vscode-variables/coc");
const vscodeResult: Promise<string> = variables("${file}", true);
const cocResult: Promise<string> = cocVariables("${file}");
// @ts-expect-error Only strings can be parsed.
variables(123);
