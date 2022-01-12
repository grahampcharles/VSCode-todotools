import * as vscode from "vscode";
import { yamlDelimiter } from "./constants";
import { isSectionHead } from "./taskpaper-utils";

type SectionBounds = {
    first: number;
    last: number;
};

export function setYamlProperty(
    editor: vscode.TextEditor,
    propertyName: string,
    propertyValue: string
): void {
    var isInSection: Boolean = false;
    const yamlInsertLine = getYamlSectionLastLineNumber(editor, true);

    // is there a Yaml section
    for (let i = 0; i < editor.document.lineCount; i++) {
        if (editor.document.lineAt(i).text === yamlDelimiter) {
            isInSection = !isInSection;
        } else if (/\S/.test(editor.document.lineAt(i).text)) {
            // something other than whitespace?
            if (isInSection) {
                const parsed = editor.document.lineAt(i).text.split(":", 2);
                if (parsed.length > 1) {
                    if (parsed[0].toString().trim() === propertyName) {
                        const lineSelection = new vscode.Selection(
                            i,
                            0,
                            i,
                            editor.document.lineAt(i).text.length
                        );
                        const newtext = Array(parsed[0], propertyValue).join(
                            ": "
                        );

                        editor.edit((editBuilder) => {
                            editBuilder.replace(lineSelection, newtext);
                        });
                    }
                }
            }
        }
    }

    // property doesn't yet exist; go ahead and add it
    const newline = Array(propertyName, propertyValue)
        .join(": ")
        .concat("\r\n");

    editor.selections = [];
    editor.edit((selectedText) => {
        selectedText.insert(new vscode.Position(yamlInsertLine, 0), newline);
    });
}

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
    const range = new vscode.Range(line, 0, line + 1, 0);
    const edit = new vscode.WorkspaceEdit();
    edit.delete(editor.document.uri, range);
    const applyThenable = vscode.workspace.applyEdit(edit);
    return applyThenable;
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

export function getYamlSectionLastLineNumber(
    editor: vscode.TextEditor,
    createIfMissing: boolean
): number {
    const yamlDelimiter = "---";
    var isInSection: boolean = false;
    var i: number;

    for (i = 0; i < editor.document.lineCount; i++) {
        if (editor.document.lineAt(i).text === yamlDelimiter) {
            if (isInSection) {
                return i;
            } else {
                isInSection = true;
            }
        }
    }

    // there was no ending delimiter!
    if (isInSection) {
        return i;
    }

    // there is no YAML section
    if (createIfMissing) {
        const lines = Array(
            "",
            yamlDelimiter,
            "# todotools settings for this document",
            "",
            yamlDelimiter
        );

        // insert the lines
        editor.edit((sel) => {
            sel.insert(
                new vscode.Position(editor.document.lineCount + 1, 0),
                lines.join("\r\n")
            );
            return i + 3; // return a pointer to the spot where stuff should be inserted
        });
    }

    return -1;
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
