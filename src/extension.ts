import * as vscode from "vscode";
import YAML = require('yaml');

import { cleanYaml, getYamlSection, isCurrentRecurringItem, parseYamlTasks } from "./yaml-utilities";
import { autoRunInterval, yamlLastRunProperty, yamlRunDaily } from "./constants";
import { Settings } from "./Settings";
import dayjs = require("dayjs");
import { getSectionOld } from "./taskpaper-utils";
import { setYamlProperty, getSectionLineNumber } from "./texteditor-utils";

let settings: Settings = new Settings();
let consoleChannel = vscode.window.createOutputChannel("ToDoTools");

/**
 *activate
 * this method is called when the extension is activated
 * @export
 * @param {vscode.ExtensionContext} context
 */
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

export function deactivate() { }
