import * as vscode from 'vscode';

import IstFoldingRangeProvider from './features/foldingRangeProvider';
import IstDocumentSymbolProvider from './features/documentSymbolProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "ist" is now active!');

	const selector = { scheme: "file", language: "ist" };

	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider(selector, new IstFoldingRangeProvider()));
	context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(selector, new IstDocumentSymbolProvider()));
}

export function deactivate() {

}
