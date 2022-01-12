import * as vscode from "vscode";
import { yamlDelimiter } from "./constants";
import { isSectionHead } from "./taskpaper-utils";

type SectionBounds = {
    first: number;
    last: number;
};

export function clearSection(
    editor: vscode.TextEditor,
    fromSection: string
): Thenable<boolean> {
    const lineRange: SectionBounds = getSectionLineNumber(editor, fromSection);

    if (lineRange.last !== -1) {
        var range = new vscode.Range(lineRange.first, 0, lineRange.last, 0);
        const edit = new vscode.WorkspaceEdit();
        edit.delete(editor.document.uri, range);
        const applyThenable = vscode.workspace.applyEdit(edit);
        return applyThenable;
    }

    return Promise.resolve(true);
}

export function deleteLine(
    editor: vscode.TextEditor,
    line: number
): Thenable<boolean> {
    const range = new vscode.Range(line - 1, 0, line, 0);
    const edit = new vscode.WorkspaceEdit();
    edit.delete(editor.document.uri, range);
    return vscode.workspace.applyEdit(edit);
}

export function getSectionLineNumber(
    editor: vscode.TextEditor,
    sectionName: string
): SectionBounds {
    let isInSection = false;
    let ret: SectionBounds = { first: -1, last: -1 };

    for (let i: number = 0; i < editor.document.lineCount; i++) {
        if (isSectionHead(editor.document.lineAt(i).text) === sectionName) {
            ret.first = i + 1;
            isInSection = true;
        } else if (
            isInSection &&
            (isSectionHead(editor.document.lineAt(i).text) ||
                editor.document.lineAt(i).text === yamlDelimiter)
        ) {
            ret.last = i - 1;
            return ret;
        } else if (isInSection) {
            ret.last = i;
        }
    }

    return ret;
}

export async function addLinesToSection(
    textEditor: vscode.TextEditor,
    section: string,
    lines: string[]
): Promise<boolean> {
    if (lines.length === 0) {
        return true;
    }
    const lineStart = getSectionLineNumber(textEditor, section).first;
    const edit = new vscode.WorkspaceEdit();

    lines.push(""); // add a newline after
    edit.insert(
        textEditor.document.uri,
        new vscode.Position(lineStart, 0),
        lines.join("\n")
    );
    return vscode.workspace.applyEdit(edit);
}

export async function replaceLine(
    textEditor: vscode.TextEditor,
    line: number,
    text: string
): Promise<boolean> {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
        textEditor.document.uri,
        new vscode.Range(line - 1, 0, line, 0),
        `${text}\n`
    );
    return vscode.workspace.applyEdit(edit);
}
