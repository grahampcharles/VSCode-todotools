import * as vscode from "vscode";
import dayjs = require("dayjs");
import YAML = require("yaml");
import { getYamlSection } from "./yaml-utilities";

export class Settings {
    runOnOpen: boolean = false;
    runDaily: boolean = false;
    lastAutoRun: dayjs.Dayjs = dayjs("");  // default to invalid date

    constructor(yamlString?: string) {
        if (!yamlString) { return; }
        this.readFromYaml(yamlString);
    }

    hasRunToday(): boolean {
        // note: format with no tz uses the system local tz
        return this.lastAutoRun.isValid() &&
            this.lastAutoRun.isSame(dayjs(), "day");
    }

    readFromYaml(yamlString: string): void {
        const yamlSettings = YAML.parse(yamlString);
        if (typeof yamlSettings === "undefined") { return; }

        // TODO: there has to be a typescript-safe loop that will do this
        if (yamlSettings.runOnOpen) { this.runOnOpen = yamlSettings.runOnOpen; }
        if (yamlSettings.runDaily) { this.runDaily = yamlSettings.runDaily; }
        if (yamlSettings.lastAutoRun) { this.lastAutoRun = dayjs(yamlSettings.lastAutoRun); }
    }

    readFromTextEditor(textEditor: vscode.TextEditor): void {
        if (textEditor) {
            const yamlString = getYamlSection(textEditor).join("\r\n");
            this.readFromYaml(yamlString);
        }
    }


};


