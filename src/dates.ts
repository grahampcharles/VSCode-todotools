// days of the week
// TODO: i8n
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

    // find the singular version of the day name
    return dayNames.indexOf(dayName.replace(/s$/g, ''));

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

export const todayDate = new Date();
// how many days have passed since the beginning of time?
// TODO: use dayjs for this?
export const daysSinceTheBeginningOfTime = daysPassed(
    new Date(0),
    todayDate
);
