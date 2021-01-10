// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { insidersDownloadDirToExecutablePath } from 'vscode-test/out/util';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('todotools.copyDailyToToday', () => {
		// The code you place here will be executed every time your command is executed

		// try to find the Daily: section
		let textEditor = vscode.window.activeTextEditor;
		if (textEditor) {
			copySection(textEditor, "Daily", "Today");
		}

	});

	context.subscriptions.push(disposable);
}

export function copySection(editor: vscode.TextEditor, fromSection: string, toSection: string) {

	var fromLines: string[] = [];
	const toLines: string[] = [];
	var isInFromSection: Boolean = false;
	var isInToSection: Boolean = false;
	var toSectionLine: number = -1;

	for (let i = 0; i < editor.document.lineCount; i++) {

		if (isSectionHead(editor.document.lineAt(i).text) === toSection) {
			isInToSection = true;
			isInFromSection = false;
			toSectionLine = i + 1; // drop in new text below
		} else if (isSectionHead(editor.document.lineAt(i).text) === fromSection) {
			isInToSection = false;
			isInFromSection = true;
		} else if (isSectionHead(editor.document.lineAt(i).text)) {
			isInToSection = false;
			isInFromSection = false;
		} else if (/\S/.test(editor.document.lineAt(i).text)) {
			// something other than whitespace?
			if (isInFromSection) { fromLines.push(editor.document.lineAt(i).text); }
			if (isInToSection) { toLines.push(editor.document.lineAt(i).text); }
		}
	}

	// remove anything from the fromLines array that's already in the toLines array
	fromLines = fromLines.filter(function (element) {
		return !toLines.includes(element);
	});

	// if there are any lines to add, put them at the top of the today section
	if (toSectionLine >= 0 && fromLines.length > 0) {
		// stick the lines here
		fromLines.push('');		// add an extra newline at the end
		editor.edit((selectedText) => {
			selectedText.insert(new vscode.Position(toSectionLine, 0),
				fromLines.join('\r\n')
			);
		});
	}

}

export function isSectionHead(line: string) {

	const trimmed: string = line.trim();

	if (trimmed.charAt(trimmed.length - 1) === ":") {
		return trimmed.substring(0, trimmed.length - 1);
	}

	return false;

}

// this method is called when your extension is deactivated
export function deactivate() { }
