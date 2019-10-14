import * as vscode from 'vscode';

import IstFoldingRangeProvider from './features/foldingRangeProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "ist" is now active!');

	const selector = { scheme: "file", language: "ist" };

	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider(selector, new IstFoldingRangeProvider()));
}

export function deactivate() {

}
