/*
    taskpaper tags:
        - item @recurAfter(3)       : recur three days after it last completed
        - item @due(date)           : move to Today on this date
        - item @weekday(Wednesday)  : occur every Wednesday

*/

import { ParsedTask } from "./ParsedTask";
import taskparser = require("taskpaper");
import { TaskPaperNode } from "./types";
import dayjs = require("dayjs");
import utc = require("dayjs/plugin/utc");
import timezone = require("dayjs/plugin/timezone");
import isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
import { TaskPaperNodeExt } from "./TaskPaperNodeExt";
import { stripTrailingWhitespace } from "./strings";

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
export function parseTaskDocument(taskdocument: string): TaskPaperNodeExt {
    // TODO: update parser to ignore trailing whitespace
    const cleaned = stripTrailingWhitespace(taskdocument);
    const doc = taskparser(cleaned);
    return new TaskPaperNodeExt(doc);
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
        dayjs(node.tagValue("due")).isSameOrBefore(dayjs(), "day")
    ) {
        // return the task itself
        results.push(node);
    }

    return results;
}

// Returns tasks that are done and have a recurrence flag
export function getRecurringTasks(node: TaskPaperNodeExt): TaskPaperNodeExt[] {
    const results = new Array<TaskPaperNodeExt>();

    // does this node have children? if so, act on the children
    if (node.children !== undefined) {
        node.children.forEach((childnode) =>
            results.push(...getRecurringTasks(childnode))
        );
    }

    // push any tasks that are due on or before today
    if (node.type === "task" && node.hasTag("done")) {
        // get the updated node
        const done = dayjs(node.tagValue("done"));

        // what's the new due date?
        if (node.hasTag("recur")) {
            const days = parseInt(node.tagValue("recur") ?? "1", 0) || 1;
            node.setTag("due", done.add(days, "day").format("YYYY-MM-DD"));
        }
        /// TODO: other flags, like "dayOfMonth(1), weekly(Tuesday)," etc.

        results.push(node);
    }

    return results;
}

// function parseTaskNode(node: TaskPaperNode): ParsedTask[] {
//     const results = new Array<ParsedTask>();

//     // does this node have children? if so, act on the children
//     if (node.children !== undefined) {
//         node.children.forEach((childnode) =>
//             results.push(...parseTaskNode(childnode))
//         );
//     }

//     if (node.type === "task") {
//         // return the task itself
//         results.push(
//             new ParsedTask({
//                 value: node.value ?? "UNDEFINED TASK",
//                 tags: node.tags ?? [],
//             } as ParsedTaskInput)
//         );
//     }

//     return results;
// }
