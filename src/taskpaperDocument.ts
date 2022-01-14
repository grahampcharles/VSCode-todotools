/*
    taskpaper tags:
        - item @recurAfter(3)       : recur three days after it last completed
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
import {
    cleanDate,
    dayNamePluralToWeekday,
    dayNameToWeekday,
    daysUntilWeekday,
} from "./dates";

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

    // push any tasks that are due on or before today
    // TODO: doesn't always have to say "done," right?
    // remove the done || annual kludge
    if (inputnode.type === "task" && inputnode.hasTag("done")) {
        // clone the node
        const node = inputnode.clone();

        // register for updated due date
        var newDueDate = dayjs(""); // invalid date

        // get the updated node; default to now
        const done = cleanDate(node.tagValue("done") || undefined);

        // what's the new due date?
        if (node.hasTag("recur")) {
            const recur = node.tagValue("recur") || "1";
            var days = parseInt(recur);

            if (isNaN(days)) {
                // pattern 1: day of the week, pluralized
                var test = dayNamePluralToWeekday(recur);
                if (test !== -1) {
                    // set to be due on the next day of that name
                    newDueDate = dayjs().add(daysUntilWeekday(test), "day");
                }

                // patter 2: day of the week, singular
                test = dayNameToWeekday(recur);
                if (test !== -1) {
                    // set to be due on the next day of that name
                    newDueDate = dayjs().add(daysUntilWeekday(test), "day");
                    // remove the recurrence; this only happens once
                    node.removeTag("recur");
                }
            }

            // default: recur every day
            if (isNaN(days)) {
                days = 1;
            }

            // use days if needed
            if (!newDueDate.isValid()) {
                newDueDate = done.add(days, "day");
            }

            // number of days
            node.setTag("due", newDueDate.format("YYYY-MM-DD"));
        }

        // if we got a due date, push the task onto the future due items stack
        if (node.hasTag("due") || node.hasTag("annual")) {
            // is this node already present?
            results.push(node);
        }
    }

    return results;
}

// Returns tasks that have a recurrence flag
export function getTasksNeedingUpdate(
    node: TaskPaperNodeExt
): TaskPaperNodeExt[] {
    const results = new Array<TaskPaperNodeExt>();

    // does this node have children? if so, act on the children
    if (node.children !== undefined) {
        node.children.forEach((childnode) =>
            results.push(...getTasksNeedingUpdate(childnode))
        );
    }

    // push any tasks that are due on or before today
    if (node.type === "task" && node.hasTag("annual") && !node.hasTag("due")) {
        // register for updated due date
        var newDueDate = dayjs(""); // invalid date

        /// annual recurrence
        if (node.hasTag("annual")) {
            let annual = cleanDate(node.tagValue("annual") || "");
            if (annual.isValid()) {
                // get the next annual occurence
                newDueDate = annual.year(dayjs().year());
                if (dayjs().isAfter(newDueDate, "day")) {
                    newDueDate = newDueDate.add(1, "year");
                }
                try {
                    node.setTag("due", newDueDate.format("YYYY-MM-DD"));
                } catch (error: any) {
                    console.log(error.toString());
                }
            }
        }

        // if we got a valid due date, push the task onto the due items stack
        if (node.hasTag("due")) {
            // is this node already present?
            results.push(node);
        }
    }

    return results;
}

export function removeDuplicates(
    nodeList: TaskPaperNodeExt[],
    masterNode: TaskPaperNodeExt
): TaskPaperNodeExt[] {
    // removes any items in the nodeList that already exist on the masterNode
    return nodeList.filter((node) => {
        return !masterNode.containsItem(node);
    });
}
