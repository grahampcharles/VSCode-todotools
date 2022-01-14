import * as vscode from "vscode";
import { autoRunInterval } from "./constants";
import { Settings } from "./Settings";
import dayjs = require("dayjs");
import { getSection } from "./taskpaper-utils";
import {
    getSectionLineNumber,
    deleteLine,
    addLinesToSection,
    replaceLine,
} from "./texteditor-utils";
import { stringToLines } from "./strings";
import {
    getDueTasks,
    getFutureTasks,
    getTasksNeedingUpdate,
    parseTaskDocument,
    removeDuplicates,
} from "./taskpaperDocument";
import { TaskPaperNodeExt } from "./TaskPaperNodeExt";

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
    if (textEditor) {
        consoleChannel.appendLine("autorun interval set");
        // set the auto-run function to run
        setInterval(autoRunFunction, autoRunInterval);
    }

    // implement a mock "pretend we just opened" command
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
     *Automatically run the copy
     * @param {vscode.TextEditor} editor
     */
    function automaticPerformCopy(editor: vscode.TextEditor) {
        // if (!settings.hasRunToday()) {
        performCopyAndSave(editor);
        // }
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
                // .then(() =>
                //     ( update last run property...)
                // )
                .then(() => editor.document.save())
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

            // get the "future" section
            var text = textEditor.document.getText();
            const future = getSection(stringToLines(text), "Future");

            var items: TaskPaperNodeExt | undefined = await parseTaskDocument(
                textEditor
            );
            if (items === undefined) {
                return false;
            }

            // 1. copy FUTURE tasks to Future
            ////////////////////////////////////
            var newFutures = new Array<string>();

            // TODO: this mutuates the Items node, and probably shouldn't
            var recurring = getFutureTasks(items);

            // remove anything that's already in the items
            const futureTasks = removeDuplicates(recurring, items);

            // add future tasks
            for (const task of futureTasks) {
                // update current line by removing recurrence flags
                await replaceLine(
                    textEditor,
                    task.index.line,
                    task.toString(["recur", "annual"])
                );

                // create future task
                newFutures.push(
                    task.toString(["done", "project", "lasted", "started"])
                );
            }

            // remove anything that's already in the future section,
            // and unduplicate
            newFutures = newFutures
                .filter((v) => !future.includes(v))
                .filter((v, i, a) => a.indexOf(v) === i);

            // add futures
            await addLinesToSection(textEditor, "Future", newFutures);

            // 2. move DUE tasks to Today
            ///////////////////////////////

            items = await parseTaskDocument(textEditor);
            if (items === undefined) {
                return false;
            }

            // get due items
            const due = getDueTasks(items);
            const adds = new Array<string>();
            const deletes = new Array<number>();

            due.forEach((item) => {
                // clear extraneous tags
                item.removeTag(["project", "lasted", "started", "done"]);
                // set to depth 2 (only top-level Today is allowed)
                item.depth = 2;
                // add task
                adds.push(item.toString());
                // delete line
                deletes.push(item.index.line);
            });

            // delete all the lines, starting from the highest-numbered
            for (const line of deletes.sort((a, b) => b - a)) {
                await deleteLine(textEditor, line);
            }

            // add all the new lines
            const linesToAdd = adds.map((add) => {
                return add.toString();
            });

            // insert the lines
            await addLinesToSection(textEditor, "Today", linesToAdd);

            /// 3. Update tasks
            //////////////////////

            items = await parseTaskDocument(textEditor);
            if (items === undefined) {
                return false;
            }

            // tasks to update
            const updateTasks = getTasksNeedingUpdate(items);
            for (const task of updateTasks) {
                await replaceLine(textEditor, task.index.line, task.toString());
            }
        }

        // nothing to execute: return true
        return new Promise<boolean>(() => true);
    }
}

export function deactivate() {}
