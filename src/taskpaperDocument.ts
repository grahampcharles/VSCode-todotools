/*
    taskpaper tags:
        - item @recurAfter(3)       : recur three days after it last completed
        - item @due(date)           : move to Today on this date
        - item @weekday(Wednesday)  : occur every Wednesday

*/

export interface TaskEntry {
    name: string;

}

/**
 *parseTaskDocument
 *
 * @export
 * @param {*} document Document returned by the taskpaper parser.
 * @return {*}  {string[]}
 */
export function parseTaskDocument(document: any): string[] {
    return [];
}