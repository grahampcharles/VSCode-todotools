import * as vscode from "vscode";
import yaml = require("yamljs");
import { insidersDownloadDirToExecutablePath } from "vscode-test/out/util";
import { log } from "console";
import { resolve } from "dns";

const yamlDelimiter = "---";
const yamlLastRunProperty = "lastAutoRun";
const yamlRunOnOpenProperty = "runOnOpen";
const yamlRunDaily = "runDaily";
const autoRunInterval = 1000 * 60 * 60 * 3;  // 3 hours

type SectionBounds = {
    first: number;
    last: number;
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // run on activation, if the "runOnOpen" parameter is set
    const textEditor = vscode.window.activeTextEditor;
    if (textEditor) {
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
        console.log("autorun called");
        let textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            automaticPerformCopy(textEditor);
        }
    };
    if (textEditor && yamlValue(textEditor, yamlRunDaily)) {
        console.log("autorun interval set");
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
        if (yamlValue(editor, yamlRunOnOpenProperty)) {
            // we *should* run on open
            // unless we jave already run today

            const lastRun = yamlValue(editor, yamlLastRunProperty);

            if (
                lastRun === undefined ||
                daysPassed(
                    new Date(lastRun.valueOf()),
                    new Date()
                ) !== 0
            ) {
                performCopyAndSave(editor);
            }
        }
    }

    function yamlValue(
        editor: vscode.TextEditor,
        key: string
    ): string | undefined {
        const yamlParsed = yaml.parse(getYamlSection(editor).join("\r\n"));
        if (yamlParsed && key in yamlParsed) {
            return yamlParsed[key] as string;
        } else {
            return undefined;
        }
    }

    function performCopyAndSave(editor: vscode.TextEditor) {
        // do the copy and update the last run flag
        performCopy(editor)
            .then(() =>
                setYamlProperty(
                    editor,
                    yamlLastRunProperty,
                    new Date().valueOf().toString() 
                )
            )
            .then(() =>
                // save after making the changes
                editor.document.save()
            );
    }

    async function performCopy(
        textEditor: vscode.TextEditor
    ): Promise<boolean> {
        // find the today line number
        if (!(getSectionLineNumber(textEditor, "Today") === undefined)) {
            // no point going on if there's no Today section

            // get today's date
            const todayDate = new Date();

            // get the "Today" section
            const today = getSection(textEditor, "Today");

            // get the "Daily" section
            var linesToAdd = getSection(textEditor, "Daily");

            // how many days have passed since the beginning of time?
            const daysSinceTheBeginningOfTime = daysPassed(
                new Date(0),
                todayDate
            );
            console.log(`days since time: ${daysSinceTheBeginningOfTime}`);
            const ordinals = [
                "Other",
                "Third",
                "Fourth",
                "Fifth",
                "Sixth",
                "Seventh",
            ];

            ordinals.forEach((element, index) => {
                if (daysSinceTheBeginningOfTime % (index + 3) === 0) {
                    linesToAdd = linesToAdd.concat(
                        getSection(textEditor, `Every ${ordinals[index]} Day`)
                    );
                }
            });

            // days of the week
            const dayNames = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
            ];
            const todayName = dayNames[todayDate.getDay()];
            // repeating ("Sundays, etc.")
            linesToAdd = linesToAdd.concat(
                getSection(textEditor, todayName.concat("s"))
            );

            // one-time
            linesToAdd = linesToAdd.concat(getSection(textEditor, todayName));

            // remove anything from the lines array that's already in the toLines array
            // and unduplicate
            linesToAdd = linesToAdd
                .filter((v) => !today.includes(v))
                .filter((v, i, a) => a.indexOf(v) === i);

            if (linesToAdd.length > 0) {
                // add a trailing item to ensure a terminal linefeed
                linesToAdd.push("");
            }

            // clear the one-time section and then insert the lines
            const todayLine = getSectionLineNumber(textEditor, "Today").first;
            return clearSection(textEditor, todayName).then(() => {
                console.info("making edit");
                const edit = new vscode.WorkspaceEdit();
                edit.insert(
                    textEditor.document.uri,
                    new vscode.Position(todayLine + 1, 0),
                    linesToAdd.join("\r\n")
                );
                const applyThenable = vscode.workspace.applyEdit(edit);
                return applyThenable;
            });
        }

        // nothing to execute: return true
        return new Promise<boolean>(() => true);
    }
}

export function daysPassed(dtBegin: Date, dtEnd: Date): number {
    const millisecondsPerDay = 1000 * 3600 * 24;
    return Math.floor(
        (treatAsUTC(dtEnd) - treatAsUTC(dtBegin)) / millisecondsPerDay
    );
}

function treatAsUTC(date: Date): number {
    var result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result.getTime();
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

function getYamlSection(editor: vscode.TextEditor): string[] {
    var sectionLines: string[] = [];
    var isInSection: Boolean = false;

    for (let i = 0; i < editor.document.lineCount; i++) {
        if (editor.document.lineAt(i).text === yamlDelimiter) {
            isInSection = !isInSection;
        } else if (/\S/.test(editor.document.lineAt(i).text)) {
            // something other than whitespace?
            if (isInSection) {
                sectionLines.push(editor.document.lineAt(i).text);
            }
        }
    }

    return sectionLines;
}

function getSection(editor: vscode.TextEditor, fromSection: string): string[] {
    var lines: string[] = [];
    var isInSection: Boolean = false;

    for (let i = 0; i < editor.document.lineCount; i++) {
        if (isSectionHead(editor.document.lineAt(i).text) === fromSection) {
            isInSection = true;
        } else if (editor.document.lineAt(i).text === yamlDelimiter) {
            isInSection = false;
        } else if (isSectionHead(editor.document.lineAt(i).text)) {
            isInSection = false;
        } else if (/\S/.test(editor.document.lineAt(i).text)) {
            // something other than whitespace?
            if (isInSection) {
                lines.push(editor.document.lineAt(i).text);
            }
        }
    }

    return lines;
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

function isSectionHead(line: string) {
    const trimmed: string = line.trim();

    if (trimmed.charAt(trimmed.length - 1) === ":") {
        return trimmed.substring(0, trimmed.length - 1);
    }

    return false;
}

// this method is called when your extension is deactivated
export function deactivate() {}
