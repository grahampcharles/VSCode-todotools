import * as assert from 'assert';
import * as vscode from 'vscode';
import * as chai from 'chai';
import { dayNames, dayNameToWeekday, daysPassed, monthNameToNumber, todayDay, todayName } from '../../dates';
import { isCurrentRecurringItem, parseYamlTasks, RecurringTask, yamlToTask } from '../../yaml-utilities';
import { expect } from 'chai';
import { testYaml, testYamlTasks, testYamlTasks2, testYamlToday } from './testdata';
import YAML = require('yaml');
import { Settings } from '../../Settings';
import dayjs = require('dayjs');
import taskparse = require('taskpaper');
import { parseTaskDocument } from '../../taskpaperDocument';
import { stringToLines } from '../../strings';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('date functions', () => {
		const date1 = new Date(2020, 1, 3);
		const date2 = new Date(2020, 1, 5);
		assert.strictEqual(2, daysPassed(date1, date2));

		// day names
		assert.strictEqual("Sunday", dayNames[0]);
		assert.strictEqual(0, dayNameToWeekday("Sunday"));

		// today's day name
		assert.strictEqual(todayName, dayNames[todayDay.day()]);

		expect(monthNameToNumber("September")).to.equal(8, "month name to number");
		expect(dayNameToWeekday("Monday")).to.equal(1, "day name to weekday");

	});

	test('yaml settings', () => {
		let settings = new Settings();

		// empty settings
		expect(settings.hasRunToday()).to.be.false;
		expect(settings.runOnOpen).to.be.false;
		expect(settings.runDaily).to.be.false;
		expect(settings.lastAutoRun.isValid()).to.be.false;

		// default settings
		settings.readFromYaml(testYaml);
		expect(settings.hasRunToday(), "default settings: hasRunToday").to.be.false;
		expect(settings.runOnOpen, "default settings: runOnOpen").to.be.true;
		expect(settings.runDaily, "default settings: runDaily").to.be.true;

		// change to today
		settings.readFromYaml(testYamlToday);
		expect(settings.hasRunToday(), "today: hasRunToday").to.be.true;

	});

	test('convert yaml to task', () => {

		expect(yamlToTask('2')).property('recurAfter').eql(2, "recurAfter");
		expect(yamlToTask('Monday')).property('dayOfWeek').eql(1, "dayOfWeek");
		expect(yamlToTask('Mondays')).property('dayOfWeek').eql(1, "dayOfWeek-pluralized");
		expect(yamlToTask('Jan. 2, 2001')).property('dateOnce').eql("2001-01-02", "dateOnce");
		expect(yamlToTask('1/2')).property('dateAnnual').eql("01-02", "dateAnnual");
		expect(yamlToTask('monthly')).property('dayOfMonth').eql(1, "dayOfMonth");
		expect(yamlToTask('September')).property('monthOfYear').eql(8, "monthOfYear");
		expect(yamlToTask('September')).property('dayOfMonth').eql(1, "dayOfMonth with monthOfYear");

	});

	test('yaml parsing', () => {

		const tasks = parseYamlTasks(testYamlTasks);
		const yamlTaskArray = testYamlTasks.split("\r\n");

		assert.strictEqual(tasks[0].name, "eat groceries");
		assert.strictEqual(tasks[0].recurAfter, 2, 'tasks-0-recurAfter');
		assert.strictEqual(tasks[2].name, "mow lawn");
		assert.strictEqual(tasks[2].recurAfter, 1);

		const shopping = tasks.filter(e => e.name === "shop");
		expect(shopping).to.have.lengthOf(1, "shopping");
		expect(shopping[0]).property("dayOfWeek").eql(2, "shopping: Tuesday");

		const taxes = tasks.filter(e => e.name === "pay taxes");
		expect(taxes).to.have.lengthOf(2, 'taxes-lengthOf');
		expect(taxes[0]).property("dateOnce").eql("2021-11-14");
		expect(taxes[1]).property("dateOnce").eql("2022-04-10");

		const xmas = tasks.filter(e => e.name === "start XMas shopping")[0];
		expect(xmas).property("dateAnnual").eql("12-01");

		const rent = tasks.filter(e => e.name === "pay rent")[0];
		expect(rent).property("dayOfMonth").eql(1, "dayOfMonth");

		const tasks2 = parseYamlTasks(testYamlTasks2);
		const coinstars = tasks2.filter(e => e.name === "CoinStar");
		expect(coinstars).to.have.lengthOf(2, "coinstars");
		expect(coinstars[1]).to.have.property("monthOfYear").eql(8, "coinstars: September");
		expect(coinstars[1]).to.have.property("dayOfMonth").eql(1, "coinstars: September (day)");

	});

	test('document creation', () => {

	});

	test('string utilities', () => {
		expect(stringToLines(`test\ntest2`)).to.have.lengthOf(2, 'stringToLines, \\n');
		expect(stringToLines(`test\rtest2`)).to.have.lengthOf(2, 'stringToLines, \\r');
		expect(stringToLines(`test\r\ntest2`)).to.have.lengthOf(2, 'stringToLines, \\r\\n');
	});

	test('taskpaper parsing', () => {
		let testItem: string = 'Test Project:\n\t- test item @done(2022-01-09) @testing';
		let document = taskparse(testItem);
		let parsed = parseTaskDocument(document);

		expect(document).property("type").eql("document");

		const item = taskparse('- test item @done(2022-01-09) @testing');
		expect(item.children[0]).property("tags").to.have.lengthOf(2);

	});

	test('recurring item checking', () => {

		let testItem: RecurringTask = {
			name: "test task",
			dateOnce: todayDay.format("YYYY-MM-DD")
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
		testItem.dayOfWeek = todayDay.get('day');
		expect(isCurrentRecurringItem(testItem)).to.be.true;
		testItem.dayOfWeek = yesterday.get('day');
		expect(isCurrentRecurringItem(testItem)).to.be.false;

	});
});
