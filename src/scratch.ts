import { daysPassed, daysSinceTheBeginningOfTime } from "./dates";
import { isCurrentRecurringItem, parseYamlTasks } from "./parseYamlTasks";

const testYaml = [
    "tasks:",
    "  mow lawn: 2",
    "  eat groceries: 1",
    "  also eat groceries: 3",
    "  again, eat groceries: 4",
    "  fifth eat groceries: 5",
    "  every other day again: 2",
    "  shop: Mondays",
    "  start XMas Shopping: 12/1",
    "  pay taxes: 11/14/2021"];

const tasks = parseYamlTasks(testYaml.join("\r\n"));

console.log(tasks);
console.log("filtered");
console.log(`day ${daysSinceTheBeginningOfTime}`);
console.log(tasks.filter((item) => {
    return isCurrentRecurringItem(item);
}));