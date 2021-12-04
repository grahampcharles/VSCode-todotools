import dayjs = require("dayjs");
import YAML = require("yaml");
import { getYamlSection, isCurrentRecurringItem, parseYamlTasks, RecurringTask, yamlToTask } from "./yaml-utilities";
import { testYaml, testYamlTasks, testYamlTasks2 } from "./test/suite/testdata";
import { dayNames, todayDay } from "./dates";
import utc = require('dayjs/plugin/utc');
import timezone = require('dayjs/plugin/timezone');

// work in the local time zone
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.guess();


// const tasks = parseYamlTasks(testYamlTasks);
// console.log(tasks);

// const dayName = "Mondays";

// console.log(dayName.replace(/s$/g, ''));
// console.log(dayNames.indexOf(dayName.replace(/s$/g, '')));

// let testItem: RecurringTask = {
//     name: "test task",
//     dayOfWeek: todayDay.get('day')
// };

// console.log(testItem.dayOfWeek);
// console.log(isCurrentRecurringItem(testItem));


try {
    const ret = YAML.parse(testYamlTasks2.replace(/\t/, "  "), { uniqueKeys: false, prettyErrors: true, strict: false });
    console.log(ret);
} catch (error) {
    if (error instanceof Error) {
        console.log(error.message);
    }
}
