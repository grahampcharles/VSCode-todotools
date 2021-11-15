import dayjs = require('dayjs');


console.log(dayjs(testParse('06-05')).toISOString());
console.log(dayjs(testParse('6/5')).toISOString());
console.log(dayjs(testParse('5 June')).toISOString());
console.log(dayjs(testParse('06-05-2021')));

function testParse(input: string) {
    return "1600-".concat(input);
}