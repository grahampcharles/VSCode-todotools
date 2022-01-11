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
import {
    isCurrentRecurringItem,
    parseYamlTasks,
    RecurringTask,
    yamlToTask,
} from "../../yaml-utilities";
import { expect } from "chai";
import {
    testYaml,
    testYamlTasks,
    testYamlTasks2,
    testYamlToday,
} from "./testdata";
import YAML = require("yaml");
import { Settings } from "../../Settings";
import dayjs = require("dayjs");
import taskparse = require("taskpaper");
import { getDueTasks, parseTaskDocument } from "../../taskpaperDocument";
import { stringToLines } from "../../strings";
import {
    ParsedTask,
    parseTagValue,
    parseTagValues,
    TagWithValue,
} from "../../ParsedTask";

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

    test("yaml settings", () => {
        let settings = new Settings();

        // empty settings
        expect(settings.hasRunToday()).to.be.false;
        expect(settings.runOnOpen).to.be.false;
        expect(settings.runDaily).to.be.false;
        expect(settings.lastAutoRun.isValid()).to.be.false;

        // default settings
        settings.readFromYaml(testYaml);
        expect(settings.hasRunToday(), "default settings: hasRunToday").to.be
            .false;
        expect(settings.runOnOpen, "default settings: runOnOpen").to.be.true;
        expect(settings.runDaily, "default settings: runDaily").to.be.true;

        // change to today
        settings.readFromYaml(testYamlToday);
        expect(settings.hasRunToday(), "today: hasRunToday").to.be.true;
    });

    test("convert yaml to task", () => {
        expect(yamlToTask("2")).property("recurAfter").eql(2, "recurAfter");
        expect(yamlToTask("Monday")).property("dayOfWeek").eql(1, "dayOfWeek");
        expect(yamlToTask("Mondays"))
            .property("dayOfWeek")
            .eql(1, "dayOfWeek-pluralized");
        expect(yamlToTask("Jan. 2, 2001"))
            .property("dateOnce")
            .eql("2001-01-02", "dateOnce");
        expect(yamlToTask("1/2"))
            .property("dateAnnual")
            .eql("01-02", "dateAnnual");
        expect(yamlToTask("monthly"))
            .property("dayOfMonth")
            .eql(1, "dayOfMonth");
        expect(yamlToTask("September"))
            .property("monthOfYear")
            .eql(8, "monthOfYear");
        expect(yamlToTask("September"))
            .property("dayOfMonth")
            .eql(1, "dayOfMonth with monthOfYear");
    });

    test("yaml parsing", () => {
        const tasks = parseYamlTasks(testYamlTasks);
        const yamlTaskArray = testYamlTasks.split("\r\n");

        assert.strictEqual(tasks[0].name, "eat groceries");
        assert.strictEqual(tasks[0].recurAfter, 2, "tasks-0-recurAfter");
        assert.strictEqual(tasks[2].name, "mow lawn");
        assert.strictEqual(tasks[2].recurAfter, 1);

        const shopping = tasks.filter((e) => e.name === "shop");
        expect(shopping).to.have.lengthOf(1, "shopping");
        expect(shopping[0]).property("dayOfWeek").eql(2, "shopping: Tuesday");

        const taxes = tasks.filter((e) => e.name === "pay taxes");
        expect(taxes).to.have.lengthOf(2, "taxes-lengthOf");
        expect(taxes[0]).property("dateOnce").eql("2021-11-14");
        expect(taxes[1]).property("dateOnce").eql("2022-04-10");

        const xmas = tasks.filter((e) => e.name === "start XMas shopping")[0];
        expect(xmas).property("dateAnnual").eql("12-01");

        const rent = tasks.filter((e) => e.name === "pay rent")[0];
        expect(rent).property("dayOfMonth").eql(1, "dayOfMonth");

        const tasks2 = parseYamlTasks(testYamlTasks2);
        const coinstars = tasks2.filter((e) => e.name === "CoinStar");
        expect(coinstars).to.have.lengthOf(2, "coinstars");
        expect(coinstars[1])
            .to.have.property("monthOfYear")
            .eql(8, "coinstars: September");
        expect(coinstars[1])
            .to.have.property("dayOfMonth")
            .eql(1, "coinstars: September (day)");
    });

    test("document creation", () => {});

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

    test("getDueTasks", () => {
        let testItem: string =
            "Test Project:\n\t- test item @due(2022-01-09) @testing\n\t- not due yet @due(3000-01-10)";
        let parsed = getDueTasks(testItem);
        expect(parsed).to.have.lengthOf(1, "due tasks parsed");
        expect(parsed[0])
            .to.have.property("value")
            .eql("test item", "due task name");
    });

    test("ParsedTask", () => {
        const testTask = new ParsedTask({
            value: "test item",
            tags: ["due(2022-01-09)", "testing"],
        });

        expect(testTask).to.have.property("value").eql("test item");
        expect(testTask).to.have.property("tags").to.have.lengthOf(2);
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

    test("recurring item checking", () => {
        let testItem: RecurringTask = {
            name: "test task",
            dateOnce: todayDay.format("YYYY-MM-DD"),
        };
        const yesterday = todayDay.subtract(1, "day");

        // dateOnce is today
        expect(isCurrentRecurringItem(testItem)).to.be.true;

        // dateOnce is not today
        testItem.dateOnce = yesterday.format("YYYY-MM-DD");
        expect(isCurrentRecurringItem(testItem)).to.be.false;
        delete testItem.dateOnce;

        // dateAnnual is today
        testItem.dateAnnual = todayDay.format("MM-DD");
        expect(isCurrentRecurringItem(testItem)).to.be.true;

        // dateAnnual is not today
        testItem.dateAnnual = yesterday.format("MM-DD");
        expect(isCurrentRecurringItem(testItem)).to.be.false;
        delete testItem.dateAnnual;

        // dayOfWeek is today's
        testItem.dayOfWeek = todayDay.get("day");
        expect(isCurrentRecurringItem(testItem)).to.be.true;
        testItem.dayOfWeek = yesterday.get("day");
        expect(isCurrentRecurringItem(testItem)).to.be.false;
    });
});
