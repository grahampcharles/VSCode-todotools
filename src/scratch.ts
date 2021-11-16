import { daysPassed, daysSinceTheBeginningOfTime } from "./dates";
import { isCurrentRecurringItem, parseYamlTasks } from "./parseYamlTasks";
import { testYaml } from "./test/suite/testdata";

const tasks = parseYamlTasks(testYaml.join("\r\n"));

console.log(tasks);
console.log("filtered");
console.log(`day ${daysSinceTheBeginningOfTime}`);
console.log(tasks.filter((item) => {
    return isCurrentRecurringItem(item);
}));