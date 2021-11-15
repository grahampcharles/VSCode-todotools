import { parseYamlTasks } from "./parseYamlTasks";

const testYaml = [
    "tasks:",
    "  mow lawn: 2",
    "  eat groceries: 1",
    "  shop: Mondays",
    "  start XMas Shopping: 12/1",
    "  pay taxes: 11/10/2021"];

const tasks = parseYamlTasks(testYaml.join("\r\n"));

console.log(tasks);