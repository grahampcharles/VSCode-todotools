import { dayNameToWeekday } from "./dates";

import YAML = require('yaml');
import dayjs = require('dayjs');
import customParseFormat = require('dayjs/plugin/customParseFormat');

/* 
    yaml format:

    tasks:
        taskname: recurrence days
        taskname: recurrence day of the week (e.g., "Fridays")
        taskname: specific day of the year
*/

export type RecurringTask = {
    name?: string,
    recurAfter?: number,     // every n days (1 = every day, 2 = every other, etc.)
    dateAnnual?: string,     // date without a year, in dd-mm format
    dateOnce?: number,       // date with a year
    dayOfWeek?: number       // day of week
};

export function parseYamlTasks(yamlSection: string): RecurringTask[] {

    const tree = YAML.parse(yamlSection);

    // get the tasks section
    if (!(tree && "tasks" in tree)) { return []; }
    const tasks = tree["tasks"];

    const tasks2 = Object.keys(tasks).map((key: string) => {
        return { name: key, ...yamlToTask(tasks[key] as number) } as RecurringTask;
    });

    return tasks2;
}

type TaskInputType = number | string;

function yamlToTask(input: TaskInputType): RecurringTask {

    if (typeof input === "number") {
        return { recurAfter: input };
    }

    if (typeof input === "string") {
        // try convert day of week
        const dayOfWeek = dayNameToWeekday(input);
        if (dayOfWeek !== -1) { return { dayOfWeek: dayOfWeek }; };

        // try to convert date with year
        const theDate = dayjs(input);
        if (theDate.isValid()) {
            // TODO: sort this 2001 kludge! it appears to work in node, but possibly not after 2049?
            if (theDate.get("year") === 2001) {
                return { dateAnnual: theDate.format('DD-MM') };
            } else {
                return { dateOnce: theDate.unix() };
            }
        }
    }

    return {};      // no parse possible

}