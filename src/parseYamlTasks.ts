import { dayNameToWeekday } from "./dates";

import YAML = require('yaml');
import dayjs = require('dayjs');

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
    dateAnnual?: string,     // date without a year, in YYYY-MM-DD format
    dateOnce?: string,       // date with a year, in YYYY-MM-DD
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
        // day of week
        const dayOfWeek = dayNameToWeekday(input);
        if (dayOfWeek !== -1) { return { dayOfWeek: dayOfWeek }; };

        // date without a year
        var theDate = dayjs("1600-".concat(input));       // concatenating 1600 to the beginning lets us detect dates without years
        if (theDate.isValid()) {
            return { dateAnnual: theDate.format('MM-DD') };
        }
        // date with a year
        theDate = dayjs(input);
        if (theDate.isValid()) {
            return { dateOnce: theDate.format('YYYY-MM-DD') };
        }
    }


    return {};      // no parse possible

}