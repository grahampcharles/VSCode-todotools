import * as vscode from "vscode";
import { autoRunInterval } from "./constants";
import { Settings } from "./Settings";
import dayjs = require("dayjs");
import { getSection } from "./taskpaper-utils";
import {
    deleteLine,
    addLinesToSection,
    replaceLine,
    editorLines,
} from "./texteditor-utils";
import { getSectionLineNumber, stringToLines } from "./strings";
import {
    getFutureTasks,
    getUpdates,
    parseTaskDocument,
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
        if (
            !(
                getSectionLineNumber(editorLines(textEditor), "Today") ===
                undefined
            )
        ) {
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
            var futureTasks = getFutureTasks(items);
            var futureString = futureTasks.map((node) => node.toString());

            // Process any updates and deletes, in reverse order of line
            // returns a flat map of only nodes that require an update
            var updates = getUpdates(items).sort(
                (nodeA, nodeB) => nodeB.index.line - nodeA.index.line
            );

            for (const updateNode of updates) {
                if (updateNode.tagValue("action") === "DELETE") {
                    // delete the line
                    await deleteLine(textEditor, updateNode.index.line);
                }
                if (updateNode.tagValue("action") === "UPDATE") {
                    // replace the line
                    await replaceLine(
                        textEditor,
                        updateNode.index.line,
                        updateNode.toString(["action"])
                    );
                }
            }

            /// 3. ADD FUTURES
            // remove anything that's already in the future section,
            // and unduplicate
            futureString = futureString
                .filter((v) => !future.includes(v))
                .filter((v, i, a) => a.indexOf(v) === i);

            // add futures
            await addLinesToSection(textEditor, "Future", futureString);

            // // 2. move DUE tasks to Today
            // ///////////////////////////////

            // items = await parseTaskDocument(textEditor);
            // if (items === undefined) {
            //     return false;
            // }

            // // get due items
            // const due = getDueTasks(items);
            // const adds = new Array<string>();
            // const deletes = new Array<number>();

            // due.forEach((item) => {
            //     // clear extraneous tags
            //     item.removeTag(["project", "lasted", "started", "done"]);
            //     // set to depth 2 (only top-level Today is allowed)
            //     item.depth = 2;
            //     // add task
            //     adds.push(item.toString());
            //     // delete line
            //     deletes.push(item.index.line);
            // });

            // // delete all the lines, starting from the highest-numbered
            // for (const line of deletes.sort((a, b) => b - a)) {
            //     await deleteLine(textEditor, line);
            // }

            // // add all the new lines
            // const linesToAdd = adds.map((add) => {
            //     return add.toString();
            // });

            // // insert the lines
            // await addLinesToSection(textEditor, "Today", linesToAdd);
        }

        // nothing to execute: return true
        return new Promise<boolean>(() => true);
    }
}

export function deactivate() {}
