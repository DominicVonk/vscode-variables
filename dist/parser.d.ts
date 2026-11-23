export interface EditorContext {
    workspaceFolders: ReadonlyArray<{
        name: string;
        uri: {
            fsPath: string;
        };
    }> | undefined;
    absoluteFilePath: string | undefined;
    lineNumber: number;
    columnNumber: number;
    defaultBuildTask?: () => Promise<string>;
    selectedText(): Promise<string>;
    configuration(name: string): string;
    executeCommand(name: string): PromiseLike<unknown>;
}
export declare function variables(context: EditorContext, input: string, recursive?: boolean): Promise<string>;
