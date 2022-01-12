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
import {
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
export function parseTaskDocument(taskdocument: string): TaskPaperNodeExt {
    // TODO: update parser to ignore trailing whitespace
    // TODO: fix parser to handle /r/n
    const cleaned = stripTrailingWhitespace(taskdocument).replace(
        /\r\n/gm,
        "\n"
    );
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
        // register for updated due date
        var newDueDate = dayjs("NONE");

        // get the updated node
        const done = dayjs(node.tagValue("done"));

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
