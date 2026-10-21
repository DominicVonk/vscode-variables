import variables from "vscode-variables";
import cocVariables from "vscode-variables/coc";
const vscodeResult: Promise<string> = variables("${file}");
const cocResult: Promise<string> = cocVariables("${file}", true);
