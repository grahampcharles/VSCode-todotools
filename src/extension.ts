import * as vscode from "vscode";
import YAML = require('yaml');

import { cleanYaml, getYamlSection, isCurrentRecurringItem, parseYamlTasks, yamlValue } from "./yaml-utilities";
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

    // get reference to the active text editor
    const textEditor = vscode.window.activeTextEditor;

    // if there is one, then perform a copy
    if (textEditor) {
        automaticPerformCopy(textEditor);
    }

    //  implement commands with registerCommand 
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

    // automatic re-run function 
    const autoRunFunction = function () {
        consoleChannel.appendLine("autorun called");
        let textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            automaticPerformCopy(textEditor);
        }
    };

    // get option for the automatic re-run interval
    if (textEditor && yamlValue(textEditor, yamlRunDaily)) {
        consoleChannel.appendLine("autorun interval set");
        // set the auto-run function to run
        setInterval(autoRunFunction, autoRunInterval);
    }

    // DEBUG: implement a mock "pretend we just opened" command
    disposable = vscode.commands.registerCommand("todotools.runOnOpen", () => {
        let textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            automaticPerformCopy(textEditor);
        }
    });
    context.subscriptions.push(disposable);

    ////////////////
    /// FUNCTIONS //
    ////////////////

    /**
     *Automatically run the copy, unless we have already run today (using local time)
     * @param {vscode.TextEditor} editor
     */
    function automaticPerformCopy(editor: vscode.TextEditor) {
        settings.readFromTextEditor(editor);
        if (!settings.hasRunToday()) { performCopyAndSave(editor); }
    }

    /**
     * Perform the copy of items to the Today section, 
     * Save the results
     *
     * @param {vscode.TextEditor} editor
     */
    function performCopyAndSave(editor: vscode.TextEditor) {
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

    /**
     *Perform the copy of any due recurring tasks into the Today section
     *
     * @param {vscode.TextEditor} textEditor
     * @return {*}  {Promise<boolean>}
     */
    async function performCopy(
        textEditor: vscode.TextEditor
    ): Promise<boolean> {
        // find the today line number
        if (!(getSectionLineNumber(textEditor, "Today") === undefined)) {
            // no point going on if there's no Today section
            // TODO: *create* a Today section?

            // get the "Today" section to see if any of the recurring tasks 
            const today = getSectionOld(textEditor, "Today");
            const recurring = parseYamlTasks(getYamlSection(textEditor).join("\r\n"));
            // LEFT OFF HERE const due = getDueTasks(textEditor);

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
