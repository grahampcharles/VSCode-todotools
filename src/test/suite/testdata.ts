import dayjs = require("dayjs");

export const testYamlTasks = `# todotools settings for this document
runOnOpen: True
runDaily: True
tasks: 
  daily: 
    - mow lawn
  2: 
    - eat groceries
    - every other day task two
  Tuesday:
    - shopping
  11/1:
    - task for 1 November
  11/14/2021:
    - pay taxes
  12/1:
    - start XMas shopping
  monthly: 
    - test monthly
  Saturday:
    - every Saturday test
    - mow lawn
`;

export const testYaml = [
  "# todotools settings for this document",
  "runOnOpen: True",
  "runDaily: True",
  "lastAutoRun: 2021-11-11T04:22:18.137Z"
].join("\r\n");

const todayString = dayjs().format();
export const testYamlToday = [
  "# todotools settings for this document",
  "runOnOpen: True",
  "runDaily: True",
  `lastAutoRun: ${todayString}`
].join("\r\n");