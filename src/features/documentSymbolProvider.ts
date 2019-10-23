import * as vscode from 'vscode';

import IstCompiler from '../compiler/compiler';
import { IstStmt, IstBranchStmt } from '../compiler/ast';

export default class IstDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
	symbols: vscode.SymbolInformation[] = [];

	provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
		this.symbols = [];

		const compiler = new IstCompiler();
		compiler.compileDocument(document);
		this.processBlock(document, '', compiler.stmts);

		return this.symbols;
	}

	private processBlock(document: vscode.TextDocument, parent: string, stmts: IstStmt[]): void {
		for (let i = 0; i < stmts.length; i++) {
			const stmt = stmts[i];
			if (stmt instanceof IstBranchStmt === false) {
				continue;
			}

			const branch = <IstBranchStmt>stmt;
			this.processBranch(document, parent, branch);
		}
	}

	private processBranch(document: vscode.TextDocument, parent: string, branch: IstBranchStmt): void {
		const lastStmt = branch.getLastStmt();
		const location = this.createLocation(document, branch.line, lastStmt.line);
		this.symbols.push(new vscode.SymbolInformation(branch.text, vscode.SymbolKind.Class, parent, location));

		for (let i = 0; i < branch.options.length; i++) {
			const option = branch.options[i];
			let endLine = option.line + 1;
			if (option.children.length > 0) {
				endLine = option.getLastStmt().line;
			}
			const location = this.createLocation(document, option.line, endLine);
			this.symbols.push(new vscode.SymbolInformation(option.text, vscode.SymbolKind.Method, parent, location));

			this.processBlock(document, option.text, option.children);
		}
	}

	private createLocation(document: vscode.TextDocument, startLine: number, endLine: number): vscode.Location {
		const end = document.lineAt(endLine);
		return new vscode.Location(document.uri, new vscode.Range(startLine, 0, endLine, end.text.length));
	}
}