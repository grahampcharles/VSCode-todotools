import * as assert from "assert";
import * as vscode from "vscode";
import * as chai from "chai";
import {
    dayNames,
    dayNameToWeekday,
    daysPassed,
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
import { ParsedTask, parseTagValue, parseTagValues } from "../../ParsedTask";
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

    // test("getDueTasks", () => {
    //     let testItem: string =
    //         "Test Project:\n\t- test item @due(2022-01-09) @testing\n\t- not due yet @due(3000-01-10)";
    //     let parsed = getDueTasks(testItem);
    //     expect(parsed).to.have.lengthOf(1, "due tasks parsed");
    //     expect(parsed[0])
    //         .to.have.property("value")
    //         .eql("test item", "due task name");
    // });

    test("ParsedTask", () => {
        const testTask = new ParsedTask({
            value: "test item",
            tags: ["due(2022-01-09)", "testing"],
        });

        expect(testTask).to.have.property("value").eql("test item");
        expect(testTask).to.have.property("tags").to.have.lengthOf(2);
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

    test("parseTagValue", () => {
        expect(parseTagValue("test"))
            .to.have.property("tag")
            .eql("test", "simple task, no value");

        const complex = parseTagValue("test(testvalue)");
        expect(complex)
            .to.have.property("tag")
            .eql("test", "complex task: tag");
        expect(complex)
            .to.have.property("value")
            .eql("testvalue", "complex task: value");
    });

    test("parseTagValues", () => {
        // string-only array, no tags
        const source1 = ["test1", "test2"];
        const parse1 = parseTagValues(source1) ?? [];
        expect(parse1).to.have.lengthOf(2, "string only array, no tags");
        expect(parse1[0] ?? undefined).to.not.eql(
            undefined,
            "parse1[0]: defined"
        );
        expect(parse1[0] ?? {})
            .to.have.property("tag")
            .eql("test1", "parse1[0]: tag");
        // TODO: how to test for undefined?
        // expect(parse1[0] ?? {}).to.have.property("value").eql(undefined, 'parse1[0]: value');
        expect(parse1[1] ?? undefined).to.not.eql(
            undefined,
            "parse1[1]: defined"
        );
        expect(parse1[1] ?? {})
            .to.have.property("tag")
            .eql("test2", "parse1[1]: tag");
        // expect(parse1[1] ?? {}).to.have.property("value").eql(undefined, 'parse1[1]: value');

        // string-only array, with values
        const source2 = ["test1(value1)", "test2(value2)"];
        const parse2 = parseTagValues(source2) ?? [];
        expect(parse2).to.have.lengthOf(2, "string only array, with tags");
        expect(parse2[0] ?? undefined).to.not.eql(
            undefined,
            "parse2[0]: defined"
        );
        expect(parse2[0] ?? {})
            .to.have.property("tag")
            .eql("test1", "parse2[0]: tag");
        expect(parse2[0] ?? {})
            .to.have.property("value")
            .eql("value1", "parse2[0]: value");
        expect(parse2[1] ?? undefined).to.not.eql(
            undefined,
            "parse2[1]: defined"
        );
        expect(parse2[1] ?? {})
            .to.have.property("tag")
            .eql("test2", "parse2[1]: tag");
        expect(parse2[1] ?? {})
            .to.have.property("value")
            .eql("value2", "parse2[1]: value");

        // array of TagWithValue
        const source3 = [
            { tag: "test1", value: "value1" } as TagWithValue,
            { tag: "test2", value: "value2" } as TagWithValue,
        ];
        const parse3 = parseTagValues(source3) ?? [];
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
