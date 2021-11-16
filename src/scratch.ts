import dayjs = require("dayjs");
import YAML = require("yaml");
import { parseYamlTasks } from "./parseYamlTasks";
import { testYaml, testYamlTasks } from "./test/suite/testdata";

const tasks = parseYamlTasks(testYamlTasks);
console.log(tasks);
