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