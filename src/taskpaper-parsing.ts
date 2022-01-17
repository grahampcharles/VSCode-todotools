import * as vscode from "vscode";
import taskpaperParse = require("taskpaper");
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
        const parsed = taskpaperParse(cleaned);
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

    // only act on undone tasks
    if (node.type !== "task" || node.hasTag("done")) {
        return results;
    }

    // push any tasks that are due on or before today
    if (
        node.hasTag("due") &&
        cleanDate(node.tagValue("due")).isSameOrBefore(dayjs(), "day")
    ) {
        // return a clone of the task
        const newnode = node.clone();
        // clear metatags relating to task completion
        newnode.removeTag(["project", "lasted", "started"]);
        // force all "Today" nodes to depth 2
        newnode.depth = 2;
        results.push(newnode);

        // set the task to be erased
        node.setTag("action", "DELETE");
    }

    return results;
}

export function getDoneTasks(
    node: TaskPaperNodeExt,
    projectName: string[] = []
): TaskPaperNodeExt[] {
    const results = new Array<TaskPaperNodeExt>();

    // don't act on a top-level Archive project
    if (
        node.type === "project" &&
        node.value?.toLowerCase() === "archive" &&
        node.depth === 1
    ) {
        return results;
    }

    // does this node have children? if so, act on the children
    if (node.children !== undefined) {
        // add the project name to the parser
        if (node.type === "project") {
            projectName.push(node.value || "Untitled Project");
        }
        node.children.forEach((childnode) =>
            results.push(...getDoneTasks(childnode, projectName))
        );
    }

    // only act on done tasks
    if (!(node.type === "task" && node.hasTag("done"))) {
        return results;
    }

    // return a clone of the task
    const newnode = node.clone();

    // add a project metatag (unless it already has one)
    if (!newnode.hasTag("project")) {
        newnode.setTag("project", projectName.join("."));
    }

    // force all "Archive" nodes to depth 2
    newnode.depth = 2;
    results.push(newnode);

    // set the task to be erased
    node.setTag("action", "DELETE");

    return results;
}

// Returns tasks that have an action flag set
export function getUpdates(node: TaskPaperNodeExt): TaskPaperNodeExt[] {
    const results = new Array<TaskPaperNodeExt>();

    // does this node have children? if so, act on the children
    if (node.children !== undefined) {
        node.children.forEach((childnode) =>
            results.push(...getUpdates(childnode))
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

    // clone the node
    const newnode = inputnode.clone();

    // filter for the recurring events (recur OR annual)
    // that have been done OR don't have a due date
    if (
        newnode.hasTag(["recur", "annual"]) &&
        (!newnode.hasTag("due") || newnode.hasTag("done"))
    ) {
        // get the updated due date; default to now
        var due: dayjs.Dayjs = dayjs(""); // intentionally invalid

        if (newnode.hasTag("recur")) {
            due = cleanDate(newnode.tagValue("done") || undefined);
            due = due.add(
                getDaysFromRecurrencePattern(newnode.tagValue("recur"), due),
                "day"
            );
        }
        if (newnode.hasTag("annual")) {
            due = cleanDate(newnode.tagValue("annual")).year(dayjs().year());
            if (due.isBefore(dayjs())) {
                due = due.add(1, "year");
            }
        }

        // valid due date?
        if (!due.isValid()) {
            return results;
        }

        // set the updated due date
        newnode.setTag("due", due.format("YYYY-MM-DD"));

        // remove the recur flag from the current location
        inputnode.removeTag(["recur", "annual"]);

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

export function removeDuplicates(
    nodeList: TaskPaperNodeExt[],
    masterNode: TaskPaperNodeExt
): TaskPaperNodeExt[] {
    // removes any items in the nodeList that already exist on the masterNode
    return nodeList.filter((node) => {
        return !masterNode.containsItem(node);
    });
}
