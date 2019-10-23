import * as vscode from 'vscode';

import IstCompiler from '../compiler/compiler';
import { IstStmt, IstBranchStmt } from '../compiler/ast';

export default class IstFoldingRangeProvider implements vscode.FoldingRangeProvider {
	ranges: vscode.FoldingRange[] = [];
	provideFoldingRanges(document: vscode.TextDocument, context: vscode.FoldingContext, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FoldingRange[]> {
		this.ranges = [];

		const compiler = new IstCompiler();
		compiler.compileDocument(document);
		this.processBlock(document, compiler.stmts);

		return this.ranges;
	}

	private processBlock(document: vscode.TextDocument, stmts: IstStmt[]): void {
		for (let i = 0; i < stmts.length; i++) {
			const stmt = stmts[i];
			if (stmt instanceof IstBranchStmt === false) {
				continue;
			}

			const branch = <IstBranchStmt>stmt;
			this.processBranch(document, branch);
		}
	}

	private processBranch(document: vscode.TextDocument, branch: IstBranchStmt): void {
		const lastStmt = branch.getLastStmt();
		this.ranges.push(new vscode.FoldingRange(branch.line, lastStmt.line));

		for (let i = 0; i < branch.options.length; i++) {
			const option = branch.options[i];
			let endLine = option.line + 1;
			if (option.children.length > 0) {
				endLine = option.getLastStmt().line;
			}
			this.ranges.push(new vscode.FoldingRange(option.line, endLine));

			this.processBlock(document, option.children);
		}
	}
}