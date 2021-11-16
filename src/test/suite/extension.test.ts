import * as assert from 'assert';
import * as vscode from 'vscode';
import * as chai from 'chai';
import { dayNames, dayNameToWeekday, daysPassed, todayDay, todayName } from '../../dates';
import { dateLocaleOptions } from '../../utilities';
import { isCurrentRecurringItem, parseYamlTasks, RecurringTask } from '../../parseYamlTasks';
import { expect } from 'chai';
import { testYaml, testYamlTasks, testYamlTasksComplex } from './testdata';
import YAML = require('yaml');
import { Settings } from '../../Settings';
import dayjs = require('dayjs');

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
		expect(settings.hasRunToday(), "default settings: has run today").to.be.false;
		expect(settings.runOnOpen, "default settings: runOnOpen").to.be.true;
		expect(settings.runDaily, "default settings: runDaily").to.be.true;

	});

	test('date locale options', () => {
		expect(dateLocaleOptions()).to.have.lengthOf(12);
	});

	test('yaml parsing', () => {

		const tasks = parseYamlTasks(testYamlTasks);
		const yamlTaskArray = testYamlTasks.split("\r\n");

		assert.strictEqual(tasks[0].name, "mow lawn");
		assert.strictEqual(tasks[0].recurAfter, 2);
		assert.strictEqual(tasks[1].name, "eat groceries");
		assert.strictEqual(tasks[1].recurAfter, 1);

		expect(tasks.length).eql(yamlTaskArray.length - 1);

		const shopping = tasks.filter(e => e.name === "shop");
		expect(shopping).to.have.lengthOf(1);
		expect(shopping[0]).property("dayOfWeek").eql(1);

		const taxes = tasks.filter(e => e.name === "pay taxes")[0];
		expect(taxes).property("dateOnce").eql("2021-11-14");

		const xmas = tasks.filter(e => e.name === "start XMas shopping")[0];
		expect(xmas).property("dateAnnual").eql("12-01");

		const novalue = tasks.filter(e => e.name === "daily with no value")[0];
		expect(novalue).property("recurAfter").eql(1);

	});

	test('yaml parsing, complex', () => {

		const tasks = parseYamlTasks(testYamlTasksComplex);
		expect(tasks.length).eql(11);

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
