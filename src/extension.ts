import * as vscode from 'vscode';

import IstFoldingRangeProvider from './features/foldingRangeProvider';
import IstDocumentSymbolProvider from './features/documentSymbolProvider';
import IstCompiler from './compiler/compiler';

let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "ist" is now active!');

	const selector = { scheme: "file", language: "ist" };

	diagnosticCollection = vscode.languages.createDiagnosticCollection('ist');
	context.subscriptions.push(diagnosticCollection);

	vscode.workspace.onDidOpenTextDocument(checkDocument, undefined, context.subscriptions);
	vscode.workspace.onDidChangeTextDocument(e => checkDocument(e.document), undefined, context.subscriptions);
	vscode.workspace.onDidSaveTextDocument(checkDocument, undefined, context.subscriptions);

	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider(selector, new IstFoldingRangeProvider()));
	context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(selector, new IstDocumentSymbolProvider()));
}

export function deactivate() {

}

function checkDocument(document: vscode.TextDocument) {
	const compiler = new IstCompiler();
	compiler.compileDocument(document);

	let diagnostics = [];
	for (let i = 0; i < compiler.errors.length; i++) {
		const error = compiler.errors[i];
		const range = new vscode.Range(error.line, 0, error.line + 1, 0);
		const diagnostic = new vscode.Diagnostic(range, error.message, vscode.DiagnosticSeverity.Error);
		diagnostics.push(diagnostic);
	}

	diagnosticCollection.set(document.uri, diagnostics);
}