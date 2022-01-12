import * as assert from "assert";
import * as vscode from "vscode";
import * as chai from "chai";
import {
    dayNamePluralToWeekday,
    dayNames,
    dayNameToWeekday,
    daysPassed,
    daysUntilWeekday,
    monthNameToNumber,
    todayDay,
    todayName,
} from "../../dates";
import { expect } from "chai";
import {
    testDocument,
    testYaml,
    testYamlTasks,
    testYamlTasks2,
    testYamlToday,
} from "./testdata";
import { Settings } from "../../Settings";
import dayjs = require("dayjs");
import taskparse = require("taskpaper");
import { stringToLines, stripTrailingWhitespace } from "../../strings";
import { TagWithValue } from "../../TagWithValue";
import { TaskPaperNode } from "../../types";

suite("Extension Test Suite", () => {
    vscode.window.showInformationMessage("Start all tests.");

    test("date functions", () => {
        const date1 = new Date(2020, 1, 3);
        const date2 = new Date(2020, 1, 5);
        assert.strictEqual(2, daysPassed(date1, date2));

        // day names
        assert.strictEqual("Sunday", dayNames[0]);
        assert.strictEqual(0, dayNameToWeekday("Sunday"));

        // today's day name
        assert.strictEqual(todayName, dayNames[todayDay.day()]);

        expect(monthNameToNumber("September")).to.equal(
            8,
            "month name to number"
        );
        expect(dayNameToWeekday("Monday")).to.equal(1, "day name to weekday");
        expect(dayNamePluralToWeekday("Monday")).to.equal(
            -1,
            "day name plural to weekday"
        );
        expect(dayNameToWeekday("Mondays")).to.equal(
            -1,
            "day name to weekday -- not plural"
        );
        expect(dayNamePluralToWeekday("Mondays")).to.equal(
            1,
            "day name plural to weekday"
        );

        const day = dayjs("2022-01-11"); // this is a Tuesday, day 2
        expect(daysUntilWeekday(2)).to.equal(7, "until Tuesday");
        expect(daysUntilWeekday(3)).to.equal(1, "until Wednesday");
        expect(daysUntilWeekday(0)).to.equal(5, "until Sunday");
    });

    test("string utilities", () => {
        expect(stringToLines(`test\ntest2`)).to.have.lengthOf(
            2,
            "stringToLines, \\n"
        );
        expect(stringToLines(`test\rtest2`)).to.have.lengthOf(
            2,
            "stringToLines, \\r"
        );
        expect(stringToLines(`test\r\ntest2`)).to.have.lengthOf(
            2,
            "stringToLines, \\r\\n"
        );
    });

    test("parseTagDocument", () => {
        const doc = testDocument;
        const parsed = taskparse(doc);

        expect(parsed).to.have.property("children");
        expect(parsed.children).to.have.lengthOf(2, "children length");
        const child0 = (parsed.children ?? [{} as TaskPaperNode])[0];
        expect(child0 ?? {})
            .to.have.property("type")
            .eql("project");
        expect(child0 ?? {})
            .to.have.property("value")
            .eql("Today");

        const todayProject = child0.children || [{} as TaskPaperNode];
        expect(todayProject).to.have.lengthOf(2, "today length");
    });

    test("stripTrailingWhitespace", () => {
        const test = `line 1\nline 2\t\nline 3  \n\nline 4`;
        const result = stripTrailingWhitespace(test);
        expect(result).eq(`line 1\nline 2\nline 3\n\nline 4`);
    });

    test("TagWithValue", () => {
        // array of TagWithValue
        const parse3 = [
            new TagWithValue("test1", "value1"),
            new TagWithValue("test2", "value2"),
        ];
        expect(parse3).to.have.lengthOf(2, "TagWithValue array");
        expect(parse3[0] ?? undefined).to.not.eql(
            undefined,
            "parse3[0]: defined"
        );
        expect(parse3[0] ?? {})
            .to.have.property("tag")
            .eql("test1", "parse3[0]: tag");
        expect(parse3[0] ?? {})
            .to.have.property("value")
            .eql("value1", "parse3[0]: value");
        expect(parse3[1] ?? undefined).to.not.eql(
            undefined,
            "parse3[1]: defined"
        );
        expect(parse3[1] ?? {})
            .to.have.property("tag")
            .eql("test2", "parse3[1]: tag");
        expect(parse3[1] ?? {})
            .to.have.property("value")
            .eql("value2", "parse3[1]: value");
    });
});
