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
import { Task } from "vscode";
import { stripYamlSection } from "./yaml-utilities";

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
export function parseTaskDocument(
    taskdocument: string
): TaskPaperNodeExt | string {
    try {
        // TODO: switch from YAML to Settings project; OR
        // update parser to ignore YAML
        const yamlstripped = stripYamlSection(taskdocument);
        const doc = taskparser(yamlstripped);
        return new TaskPaperNodeExt(doc);
    } catch (error: any) {
        return error.toString();
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
        dayjs(node.tagValue("due")).isSameOrBefore(dayjs(), "day")
    ) {
        // return the task itself
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
