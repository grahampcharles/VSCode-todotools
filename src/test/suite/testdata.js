"use strict";
exports.__esModule = true;
exports.testYamlToday = exports.testYaml = exports.testYamlTasks = void 0;
var dayjs = require("dayjs");
exports.testYamlTasks = "# todotools settings for this document\nrunOnOpen: True\nrunDaily: True\ntasks: \n  daily: \n    - mow lawn\n  2: \n    - eat groceries\n    - every other day task two\n  Tuesday:\n    - shopping\n  11/1:\n    - task for 1 November\n  11/14/2021:\n    - pay taxes\n  12/1:\n    - start XMas shopping\n  monthly: \n    - test monthly\n  Saturday:\n    - every Saturday test\n";
exports.testYaml = [
    "# todotools settings for this document",
    "runOnOpen: True",
    "runDaily: True",
    "lastAutoRun: 2021-11-11T04:22:18.137Z"
].join("\r\n");
var todayString = dayjs().format();
exports.testYamlToday = [
    "# todotools settings for this document",
    "runOnOpen: True",
    "runDaily: True",
    "lastAutoRun: " + todayString
].join("\r\n");
