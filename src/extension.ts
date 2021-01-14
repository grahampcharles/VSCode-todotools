// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import yaml = require('yamljs');
import { insidersDownloadDirToExecutablePath } from 'vscode-test/out/util';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// run on activation, if the "runOnOpen" parameter is set
	let textEditor = vscode.window.activeTextEditor;
	if (textEditor) {
		const yamlParsed = yaml.parse(
			getYamlSection(textEditor).join('\r\n'));
		if (yamlParsed) {
			if ("runOnOpen" in yamlParsed) {
				if (yamlParsed.runOnOpen) {
					performCopy(textEditor);
				}
			}
		}
	}

	// provide the implementation of the command with registerCommand
	let disposable = vscode.commands.registerCommand('todotools.copyDailyToToday', () => {

		let textEditor = vscode.window.activeTextEditor;
		if (textEditor) {
			performCopy(textEditor);
		}
	});
	context.subscriptions.push(disposable);

	function performCopy(textEditor: vscode.TextEditor) {

		// find the today line number
		const todayLine = getSectionLineNumber(textEditor, "Today");
		if (!(todayLine === undefined)) {   // no point going on if there's no Today section

			// get the "Today" section
			const today = getSection(textEditor, "Today");

			// get the "Daily" section
			var lines = getSection(textEditor, "Daily");

			// how many days have passed since the beginning of time?	
			const daysSinceTheBeginningOfTime = daysPassed(new Date(0), new Date());

			// is this day divisible by 3?
			if (daysSinceTheBeginningOfTime % 3 === 0) {
				// add the "Every Third Day" section
				lines = lines.concat(getSection(textEditor, "Every Third Day"));
			}

			// remove anything from the lines array that's already in the toLines array
			// and unduplicate
			lines = lines
				.filter((v) => !today.includes(v))
				.filter((v, i, a) => a.indexOf(v) === i);

			if (lines.length > 0) {
				// add a trailing item to ensure a terminal linefeed
				lines.push('');
			}

			// insert the lines 
			textEditor.edit((selectedText) => {
				selectedText.insert(new vscode.Position(todayLine + 1, 0),
					lines.join('\r\n')
				);
			});
		}
	}

}

function daysPassed(dtBegin: Date, dtEnd: Date): number {
	const differenceInTime = dtEnd.getTime() - dtBegin.getTime();
	const millisecondsPerDay = 1000 * 3600 * 24;
	return Math.ceil(differenceInTime / millisecondsPerDay);
}

function getYamlSection(editor: vscode.TextEditor): string[] {

	var sectionLines: string[] = [];
	var isInSection: Boolean = false;
	const yamlDelimiter = '---';

	for (let i = 0; i < editor.document.lineCount; i++) {

		if (editor.document.lineAt(i).text === yamlDelimiter) {
			isInSection = !isInSection;
		} else if (/\S/.test(editor.document.lineAt(i).text)) {
			// something other than whitespace?
			if (isInSection) { sectionLines.push(editor.document.lineAt(i).text); }
		}
	}

	return sectionLines;
}

function getSection(editor: vscode.TextEditor, fromSection: string): string[] {

	var sectionLines: string[] = [];
	var isInSection: Boolean = false;

	for (let i = 0; i < editor.document.lineCount; i++) {

		if (isSectionHead(editor.document.lineAt(i).text) === fromSection) {
			isInSection = true;
		} else if (isSectionHead(editor.document.lineAt(i).text)) {
			isInSection = false;
		} else if (/\S/.test(editor.document.lineAt(i).text)) {
			// something other than whitespace?
			if (isInSection) { sectionLines.push(editor.document.lineAt(i).text); }
		}
	}

	return sectionLines;
}

function getSectionLineNumber(editor: vscode.TextEditor, sectionName: string) {
	for (let i = 0; i < editor.document.lineCount; i++) {
		if (isSectionHead(editor.document.lineAt(i).text) === sectionName) {
			return i;
		}
	}
}

function isSectionHead(line: string) {

	const trimmed: string = line.trim();

	if (trimmed.charAt(trimmed.length - 1) === ":") {
		return trimmed.substring(0, trimmed.length - 1);
	}

	return false;

}

// this method is called when your extension is deactivated
export function deactivate() { }
