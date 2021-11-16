export const testYamlTasks = [
    "tasks:",
    "  mow lawn: 2",
    "  eat groceries: 1",
    "  daily with no value: 1",
    "  also eat groceries: 3",
    "  again, eat groceries: 4",
    "  fifth eat groceries: 5",
    "  every other day again: 2",
    "  shop: Mondays",
    "  start XMas shopping: 12/1",
    "  pay taxes: 11/14/2021"].join("\r\n");

export const testYamlTasksComplex = `tasks:
  mow lawn: 2
  test daily 1: 1
  test daily 2: 1
  test other day: 2
  test third day: 3
  test fourth day: 4
  test fifth day: 5
  test monthly: 30	
  test every Monday: Monday
  every Saturday test: Saturday
  test Nov. 2 item: 11/02`;

export const testYaml = [
    "# todotools settings for this document",
    "runOnOpen: True",
    "runDaily: True",
    "lastAutoRun: 2021-11-11T04:22:18.137Z"
].join("\r\n");