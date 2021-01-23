import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Date functions', () => {
		const date1 = new Date(2020, 1, 3);
		const date2 = new Date(2020, 1, 5);
		assert.strictEqual(3, myExtension.daysPassed(date1, date2));
	});
});
