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
    return new TaskPaperNodeExt(taskparser(taskdocument));
}

/**
 *Filters task document to return an array of tasks that have a @due tag
 *on or before today in the current time zone.
 * @export
 * @param {*} taskpaperText
 */
// export function getDueTasks(taskpaperText: string): ParsedTask[] {
//     const allTasks = parseTaskDocument(taskpaperText);

//     // return allTasks.filter((task) => {
//     //     const due = task.tags?.filter((tag) => tag.tag === "due");
//     //     if (due !== undefined && due.length > 0) {
//     //         const dateString = due[0].value;
//     //         if (dayjs(dateString).isSameOrBefore(dayjs(), "day")) {
//     //             // this task is due
//     //             return true;
//     //         }
//     //     }
//     //     return false;
//     // });
// }

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
