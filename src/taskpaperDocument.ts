/*
    taskpaper tags:
        - item @recur(3)            : recur three days after it last completed
        - item @due(date)           : move to Today on this date
        - item @weekday(Wednesday)  : occur every Wednesday

*/

import * as vscode from "vscode";
import taskparser = require("taskpaper");
import dayjs = require("dayjs");
import utc = require("dayjs/plugin/utc");
import timezone = require("dayjs/plugin/timezone");
import isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
import { TaskPaperNodeExt } from "./TaskPaperNodeExt";
import { stripTrailingWhitespace } from "./strings";
import { cleanDate, getDaysFromRecurrencePattern } from "./dates";

// work in the local time zone
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.guess();

// date comparison extension
dayjs.extend(isSameOrBefore);

/**
 *parseTaskDocument
 *
 * @export
 * @param {*} document Document returned by the taskpaper parser.
 * @return {*} all the tasks in the document.
 */
export async function parseTaskDocument(
    editor: vscode.TextEditor
): Promise<TaskPaperNodeExt | undefined> {
    // parse the taskpaper again if possible
    try {
        const text = editor.document.getText();
        // TODO: update parser to ignore trailing whitespace
        const cleaned = stripTrailingWhitespace(text);
        const parsed = taskparser(cleaned);
        return new TaskPaperNodeExt(parsed);
    } catch (error: any) {
        // report error to user
        await vscode.window.showInformationMessage(error.toString());
        return undefined;
    }
}

/**
 *Returns all tasks that are @due today or earlier, not @done, and not in "Today"
 *
 * @export
 * @param {TaskPaperNodeExt} node
 * @return {*}  {TaskPaperNodeExt[]}
 */
export function getDueTasks(node: TaskPaperNodeExt): TaskPaperNodeExt[] {
    const results = new Array<TaskPaperNodeExt>();

    // does this node have children? if so, act on the children
    // but skip the Today project
    if (!(node.type === "project" && node.value?.toLowerCase() === "today")) {
        if (node.children !== undefined) {
            node.children.forEach((childnode) =>
                results.push(...getDueTasks(childnode))
            );
        }
    }

    // push any tasks that are due on or before today
    if (
        node.type === "task" &&
        node.hasTag("due") &&
        cleanDate(node.tagValue("due")).isSameOrBefore(dayjs(), "day")
    ) {
        // return the task itself
        results.push(node);
    }

    return results;
}

// Returns tasks that have an action flag set
export function getUpdates(node: TaskPaperNodeExt): TaskPaperNodeExt[] {
    const results = new Array<TaskPaperNodeExt>();

    // does this node have children? if so, act on the children
    if (node.children !== undefined) {
        node.children.forEach((childnode) =>
            results.push(...getFutureTasks(childnode))
        );
    }

    if (node.hasTag("action")) {
        results.push(node);
    }
    return results;
}

// Returns tasks that have a future recurrence flag
export function getFutureTasks(
    inputnode: TaskPaperNodeExt
): TaskPaperNodeExt[] {
    const results = new Array<TaskPaperNodeExt>();

    // does this node have children? if so, act on the children
    if (inputnode.children !== undefined) {
        inputnode.children.forEach((childnode) =>
            results.push(...getFutureTasks(childnode))
        );
    }

    // only further process tasks
    if (inputnode.type !== "task") {
        return results;
    }

    /// REGISTERS
    // clone the node
    const newnode = inputnode.clone();

    // register for updated due date
    var newDueDate = dayjs(""); // intentionally invalid date

    // #1: recurring, no due date assigned
    if (newnode.hasTag("recur") && !newnode.hasTag("due")) {
        // get the updated due date; default to now
        var due = cleanDate(newnode.tagValue("done") || undefined);
        due.add(
            getDaysFromRecurrencePattern(newnode.tagValue("recur"), due),
            "day"
        );

        // set the updated due date
        newnode.setTag("due", newDueDate.format("YYYY-MM-DD"));

        // remove the recur flag from the current location
        inputnode.removeTag("recur");

        // if there's a @done, flag this item to be updated in its current location;
        // otherwise, flag this item to be deleted from its current location
        inputnode.setTag(
            "action",
            inputnode.hasTag("done") ? "UPDATE" : "DELETE"
        );

        // copy this item without @done, @lasted, @started
        newnode.removeTag(["done", "lasted", "started"]);
        results.push(newnode);
    }

    return results;
}

// // Returns tasks that have a recurrence flag
// export function getTasksNeedingUpdate(
//     node: TaskPaperNodeExt
// ): TaskPaperNodeExt[] {
//     const results = new Array<TaskPaperNodeExt>();

//     // does this node have children? if so, act on the children
//     if (node.children !== undefined) {
//         node.children.forEach((childnode) =>
//             results.push(...getTasksNeedingUpdate(childnode))
//         );
//     }

//     // push any tasks that are due on or before today
//     if (node.type === "task" && node.hasTag("annual") && !node.hasTag("due")) {
//         // register for updated due date
//         var newDueDate = dayjs(""); // invalid date

//         /// annual recurrence
//         if (node.hasTag("annual")) {
//             let annual = cleanDate(node.tagValue("annual") || "");
//             if (annual.isValid()) {
//                 // get the next annual occurence
//                 newDueDate = annual.year(dayjs().year());
//                 if (dayjs().isAfter(newDueDate, "day")) {
//                     newDueDate = newDueDate.add(1, "year");
//                 }
//                 try {
//                     node.setTag("due", newDueDate.format("YYYY-MM-DD"));
//                 } catch (error: any) {
//                     console.log(error.toString());
//                 }
//             }
//         }

//         // if we got a valid due date, push the task onto the due items stack
//         if (node.hasTag("due")) {
//             // is this node already present?
//             results.push(node);
//         }
//     }

//     return results;
// }

export function removeDuplicates(
    nodeList: TaskPaperNodeExt[],
    masterNode: TaskPaperNodeExt
): TaskPaperNodeExt[] {
    // removes any items in the nodeList that already exist on the masterNode
    return nodeList.filter((node) => {
        return !masterNode.containsItem(node);
    });
}
