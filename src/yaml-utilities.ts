import * as vscode from "vscode";
import YAML = require("yaml");
import dayjs = require("dayjs");
import utc = require("dayjs/plugin/utc");
import timezone = require("dayjs/plugin/timezone");

// work in the local time zone
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.guess();

import { yamlDelimiter } from "./constants";
import { dayNameToWeekday, daysSinceTheBeginningOfTime, monthNameToNumber, todayDay } from "./dates";

export function yamlValue(
    editor: vscode.TextEditor,
    key: string
): string | undefined {
    const yamlParsed = YAML.parse(cleanYaml(getYamlSection(editor).join("\r\n")));

    if (!(yamlParsed && key in yamlParsed)) { return undefined; }
    return yamlParsed[key] as string;
}

export function getYamlSection(editor: vscode.TextEditor): string[] {
    var sectionLines: string[] = [];
    var isInSection: Boolean = false;

    for (let i = 0; i < editor.document.lineCount; i++) {
        if (editor.document.lineAt(i).text === yamlDelimiter) {
            isInSection = !isInSection;
        } else if (/\S/.test(editor.document.lineAt(i).text)) {
            // something other than whitespace?
            if (isInSection) {
                sectionLines.push(editor.document.lineAt(i).text);
            }
        }
    }

    // TODO: clean the yaml a bit
    return sectionLines;
}

/* 
    yaml format:

    tasks:
        taskname: recurrence days
        taskname: recurrence day of the week (e.g., "Fridays")
        taskname: specific day of the year


    new yaml format:
    tasks:
        sectionname:   # recurrence pattern
            - taskname
            - taskname


*/

export type RecurringTask = {
    name?: string,
    recurAfter?: number,     // every n days (1 = every day, 2 = every other, etc.)
    dateAnnual?: string,     // date without a year, in YYYY-MM-DD format
    dateOnce?: string,       // date with a year, in YYYY-MM-DD
    dayOfWeek?: number,      // day of week
    dayOfMonth?: number,     // day of month
    monthOfYear?: number
};

/**
 * Returns a boolean indicating whether this task should be added today.
 *
 * @export
 * @param {RecurringTask} task
 * @return {*}  {boolean}
 */
export function isCurrentRecurringItem(task: RecurringTask): boolean {
    if (
        task.recurAfter !== undefined &&
        daysSinceTheBeginningOfTime % task.recurAfter === 0
    ) {
        return true;
    }
    if (
        task.dateAnnual !== undefined &&
        dayjs(task.dateAnnual).format("MM-DD") === dayjs().format("MM-DD")
    ) {
        return true;
    }
    if (
        task.dateOnce !== undefined &&
        dayjs(task.dateOnce).format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD")
    ) {
        return true;
    }
    if (task.dayOfWeek !== undefined && todayDay.day() === task.dayOfWeek) {
        return true;
    }
    if (task.dayOfMonth !== undefined && todayDay.date() === task.dayOfMonth) {
        return true;
    }

    return false;
}


/**
 *cleanYaml
 *Cleans the YAML section of tabs.
 * @param {string} input
 * @return {*}  {string}
 */
export function cleanYaml(input: string): string {
    return input.replace(/\t/g, "  ");
}

/**
 *parseYamlTasks
 *Parses the "tasks" value of a YAML string into a recurring tasks array.
 * @export
 * @param {string} yamlSection The contents of the YAML task section.
 * @return {*}  {RecurringTask[]}
 */
export function parseYamlTasks(yamlSection: string): RecurringTask[] {

    let tree: any;

    // try to parse the whole tree
    try {
        tree = YAML.parse(cleanYaml(yamlSection), { uniqueKeys: false, prettyErrors: true, strict: false });
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showInformationMessage(error.message);
        }
        return [];
    }

    // get the tasks section
    if (!(tree && "tasks" in tree)) { return []; }
    const tasks = tree["tasks"];

    // convert each task into a RecurringTask object
    return Object.keys(tasks).flatMap((pattern: string) => {
        const taskProps = yamlToTask(pattern);
        return tasks[pattern].map((key: string) => {
            return ({ name: key, ...taskProps } as RecurringTask);
        }
        );
    });
}

type TaskInputType = number | string;

export function yamlToTask(input: TaskInputType): RecurringTask {
    // is this a number | numeric string?
    if (!isNaN(+input)) {
        return { recurAfter: +input };
    }

    if (typeof input === "string") {
        // certain constants
        if (input.toLowerCase() === "daily") {
            return { recurAfter: 1 };
        }
        if (input.toLowerCase() === "monthly") {
            return { dayOfMonth: 1 };
        }

        // day of week
        const dayOfWeek = dayNameToWeekday(input);
        if (dayOfWeek !== -1) {
            return { dayOfWeek: dayOfWeek };
        }

        // month of year
        const monthOfYear = monthNameToNumber(input);
        if (monthOfYear !== -1) {
            return { monthOfYear: monthOfYear, dayOfMonth: 1 };
        }

        // date without a year
        if (input.length <= 5) {
            // concatenating 1600 to the beginning helps
            // us detect dates without years
            var theDate = dayjs("1600-".concat(input));
            if (theDate.isValid()) {
                return { dateAnnual: theDate.format("MM-DD") };
            }
        } else {
            // date with a year
            theDate = dayjs(input);
            if (theDate.isValid()) {
                return { dateOnce: theDate.format("YYYY-MM-DD") };
            }
        }
    }

    return {}; // no parse possible
}

