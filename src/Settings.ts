import * as vscode from "vscode";
import dayjs = require("dayjs");

export class Settings {
    runOnOpen: boolean = false;
    runDaily: boolean = false;
    // lastAutoRun: dayjs.Dayjs = dayjs("");  // default to invalid date

    constructor() {
        // TODO: read settings elsewhere
        this.runOnOpen = true;
        this.runDaily = true;
    }
}
