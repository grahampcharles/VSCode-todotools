import dayjs = require("dayjs");
import YAML = require("yaml");
import { parseYamlTasks, yamlToTask } from "./yaml-utilities";
import { testYaml, testYamlTasks } from "./test/suite/testdata";

const tasks = parseYamlTasks(testYamlTasks);
console.log(tasks);
