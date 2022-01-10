// days of the week
import dayjs = require("dayjs");
import utc = require('dayjs/plugin/utc');
import timezone = require('dayjs/plugin/timezone');
import localedata = require('dayjs/plugin/localeData');

// work in the local time zone and locale
dayjs.extend(localedata);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.guess();

// TODO: replace with dayjs.weekdays()
export const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];


/// returns -1 on nonexistent
export function dayNameToWeekday(dayName: string): number {

    // find the singular version of the day name (including plural of day name)
    return dayNames.indexOf(dayName.replace(/s$/g, ''));

}

export function monthNameToNumber(monthName: string): number {

    // find the month name in the month array
    return dayjs.months().indexOf(monthName);

}

export function daysPassed(dtBegin: Date, dtEnd: Date): number {
    const millisecondsPerDay = 1000 * 3600 * 24;
    return Math.floor(
        (treatAsUTC(dtEnd) - treatAsUTC(dtBegin)) / millisecondsPerDay
    );
}

export function treatAsUTC(date: Date): number {
    var result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result.getTime();
}

export const todayDay = dayjs();
export const todayName = dayNames[todayDay.day()];

// how many days have passed since the beginning of time?
// TODO: use dayjs for this?
export const daysSinceTheBeginningOfTime = daysPassed(
    new Date(0),
    todayDay.toDate()
);
