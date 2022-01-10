/*
    taskpaper tags:
        - item @recurAfter(3)       : recur three days after it last completed
        - item @due(date)           : move to Today on this date
        - item @weekday(Wednesday)  : occur every Wednesday

*/



/**
 *Filters task document to return an array of tasks that have a @due tag
 *
 * @export
 * @param {*} taskdocument
 */
export function getDueTasks(taskdocument: any): any[] {

    return [];
}

/**
 *parseTaskDocument
 *
 * @export
 * @param {*} document Document returned by the taskpaper parser.
 * @return {*} document with  
 */
export function parseTaskDocument(taskdocument: any): any[] {
    return [];
}