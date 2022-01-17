import * as assert from "assert";
import * as vscode from "vscode";
import {
    cleanDate,
    dayNamePluralToWeekday,
    dayNames,
    dayNameToWeekday,
    daysPassed,
    daysUntilWeekday,
    getDaysFromRecurrencePattern,
    monthNameToNumber,
    todayDay,
    todayName,
} from "../../dates";
import { expect } from "chai";
import { testDocument } from "./testdata";
import taskparse = require("taskpaper");
import {
    getSectionLineNumber,
    SectionBounds,
    stringToLines,
    stripTrailingWhitespace,
} from "../../strings";
import { TagWithValue } from "../../TagWithValue";
import { TaskPaperNode } from "../../types";
import dayjs = require("dayjs");
import { TaskPaperNodeExt } from "../../TaskPaperNodeExt";
import { getDoneTasks } from "../../taskpaper-parsing";

suite("Extension Test Suite", () => {
    vscode.window.showInformationMessage("Start all tests.");

    test("clean date", () => {
        const date1 = cleanDate("1/11");
        expect(date1.year()).eq(2001);
        expect(date1.format("YYYY-MM-DD")).eq(`2001-01-11`);

        const date2 = cleanDate("22-01-13 13:45");
        expect(date2.format("YYYY-MM-DD HH:mm")).eq("2022-01-13 13:45");

        expect(cleanDate("2020-01-03").format("YYYY-MM-DD")).eq(
            "2020-01-03",
            "simple date"
        );
    });

    test("getDaysFromRecurrencePattern", () => {
        expect(getDaysFromRecurrencePattern("2")).to.eql(2, "in two days");
        expect(getDaysFromRecurrencePattern(undefined)).to.eql(1, "undefined");
    });

    test("getDoneTasks", () => {
        const source = {
            type: "document",
            children: [
                { type: "project", value: "Today", depth: 1 } as TaskPaperNode,
                {
                    type: "task",
                    value: "item 1",
                    depth: 2,
                    tags: ["due(whenever)"],
                } as TaskPaperNode,
                {
                    type: "task",
                    value: "item 2",
                    depth: 2,
                    tags: ["done(2022-01-16)"],
                } as TaskPaperNode,
            ],
        } as TaskPaperNode;
        const node = new TaskPaperNodeExt(source);
        const done = getDoneTasks(node);

        expect(done).to.have.lengthOf(1, "parsed done tasks");
        expect(done[0].tagValue("project")).to.eq(
            "Today",
            "parsed project name from tree"
        );
    });

    test("getSectionLineNumber", () => {
        const section = ["Project:", "\t-item", "", "Future:"];
        const bounds: SectionBounds = getSectionLineNumber(section, "Future");
        expect(bounds).to.have.property("first").eql(3);
        expect(bounds).to.have.property("last").eql(-1);
    });

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

        const day = cleanDate("2022-01-11"); // this is a Tuesday, day 2
        expect(daysUntilWeekday(2, day)).to.equal(7, "until Tuesday");
        expect(daysUntilWeekday(3, day)).to.equal(1, "until Wednesday");
        expect(daysUntilWeekday(0, day)).to.equal(5, "until Sunday");
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

        const section = ["Project:", "\t-item", "", "Future:"];
        expect(stringToLines(section.join("\r\n"))).to.have.lengthOf(
            4,
            "string to lines CRLF, with empty"
        );
        expect(stringToLines(section.join("\n"))).to.have.lengthOf(
            4,
            "string to lines LF, with empty"
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
        const tag1 = new TagWithValue("simpletag");
        expect(tag1).to.have.property("tag").eql("simpletag");

        const tag2 = new TagWithValue("due(2022-01-01)");
        expect(tag2).to.have.property("tag").eql("due");
        expect(tag2).to.have.property("value").eql("2022-01-01");

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
