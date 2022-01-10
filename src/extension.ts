import * as vscode from "vscode";
import YAML = require('yaml');

import { cleanYaml, getYamlSection, isCurrentRecurringItem, parseYamlTasks } from "./yaml-utilities";
import { autoRunInterval, yamlDelimiter, yamlLastRunProperty, yamlRunDaily, yamlRunOnOpenProperty } from "./constants";
import { Settings } from "./Settings";
import dayjs = require("dayjs");
import { getSectionOld, isSectionHead } from "./taskpaper-utils";

type SectionBounds = {
    first: number;
    last: number;
};
let settings: Settings = new Settings();

let consoleChannel = vscode.window.createOutputChannel("ToDoTools");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // run on activation, if the "runOnOpen" parameter is set
    const textEditor = vscode.window.activeTextEditor;

    // get settings
    if (textEditor) {
        // perform automatic copy
        automaticPerformCopy(textEditor);
    }

    // provide the implementation of the command with registerCommand
    let disposable = vscode.commands.registerCommand(
        "todotools.copyDailyToToday",
        () => {
            let textEditor = vscode.window.activeTextEditor;
            if (textEditor) {
                performCopy(textEditor);
            }
        }
    );
    context.subscriptions.push(disposable);

    // automatic re-run
    const autoRunFunction = function () {
        consoleChannel.appendLine("autorun called");
        let textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            automaticPerformCopy(textEditor);
        }
    };
    if (textEditor && yamlValue(textEditor, yamlRunDaily)) {
        consoleChannel.appendLine("autorun interval set");
        setInterval(autoRunFunction, autoRunInterval);
    }

    // provide the implementation of the command with registerCommand
    disposable = vscode.commands.registerCommand("todotools.runOnOpen", () => {
        let textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            automaticPerformCopy(textEditor);
        }
    });
    context.subscriptions.push(disposable);

    function automaticPerformCopy(editor: vscode.TextEditor) {
        // we *should* run on open
        // unless we have already run today (local time)
        settings.readFromTextEditor(editor);
        if (!settings.hasRunToday()) { performCopyAndSave(editor); }
    }

    function yamlValue(
        editor: vscode.TextEditor,
        key: string
    ): string | undefined {
        const yamlParsed = YAML.parse(cleanYaml(getYamlSection(editor).join("\r\n")));

        if (!(yamlParsed && key in yamlParsed)) { return undefined; }
        return yamlParsed[key] as string;
    }

    function performCopyAndSave(editor: vscode.TextEditor) {
        // do the copy and update the last run flag
        try {
            performCopy(editor)
                .then(() =>
                    setYamlProperty(
                        editor,
                        yamlLastRunProperty,
                        dayjs().toISOString()
                    )
                )
                .then(() =>
                    // save after making the changes
                    editor.document.save()
                )
                .catch((reason: any) => {
                    if (reason instanceof Error) {
                        console.log(reason.message);
                    }
                });
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.log(err.message);
            }
        }
    }

    async function performCopy(
        textEditor: vscode.TextEditor
    ): Promise<boolean> {
        // find the today line number
        if (!(getSectionLineNumber(textEditor, "Today") === undefined)) {
            // no point going on if there's no Today section

            // get the "Today" section for comparison
            const today = getSectionOld(textEditor, "Today");
            const recurring = parseYamlTasks(getYamlSection(textEditor).join("\r\n"));

            const linesToAdd = recurring
                .filter((item) => isCurrentRecurringItem(item))
                // add leading tab
                .map((item) => `\t- ${item.name}` ?? "")
                // remove anything that's already in the today
                .filter((v) => !today.includes(v))
                // unduplicate
                .filter((v, i, a) => a.indexOf(v) === i)
                ;

            if (linesToAdd.length > 0) {
                // add a trailing item to ensure a terminal linefeed
                linesToAdd.push("");
            }

            // insert the lines
            const todayLine = getSectionLineNumber(textEditor, "Today").first;
            const edit = new vscode.WorkspaceEdit();
            edit.insert(
                textEditor.document.uri,
                new vscode.Position(todayLine + 1, 0),
                linesToAdd.join("\r\n")
            );
            const applyThenable = vscode.workspace.applyEdit(edit);
            return applyThenable;
        }

        // nothing to execute: return true
        return new Promise<boolean>(() => true);
    }
}

function setYamlProperty(
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

function clearSection(
    editor: vscode.TextEditor,
    fromSection: string
): Thenable<boolean> {
    const lineRange: SectionBounds = getSectionLineNumber(editor, fromSection);

    if (lineRange.last !== -1) {
        console.info("making clear");
        var range = new vscode.Range(lineRange.first, 0, lineRange.last, 0);
        const edit = new vscode.WorkspaceEdit();
        edit.delete(editor.document.uri, range);
        const applyThenable = vscode.workspace.applyEdit(edit);
        return applyThenable;
    }

    return Promise.resolve(true);
}

function getSectionLineNumber(
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

function getYamlSectionLastLineNumber(
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


// this method is called when your extension is deactivated
export function deactivate() { }
