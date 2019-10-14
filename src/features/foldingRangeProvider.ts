import * as vscode from 'vscode';

import IstUtils from './utils';
import { BRANCH_PREFIX } from './consts';

export default class IstFoldingRangeProvider implements vscode.FoldingRangeProvider {
	ranges: vscode.FoldingRange[] = [];

	provideFoldingRanges(document: vscode.TextDocument, context: vscode.FoldingContext, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FoldingRange[]> {
		this.ranges = [];
		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i);
			this.processLine(document, line);
		}
		return this.ranges;
	}

	private processLine(document: vscode.TextDocument, line: vscode.TextLine) {
		if (line.isEmptyOrWhitespace) {
			return;
		}

		if (IstUtils.isBranch(line.text) === false) {
			return;
		}

		const indent = IstUtils.getIndent(line.text);
		const endLineNumber = this.findNextLine(document, line.lineNumber + 1, indent) - 1;
		if (line.lineNumber < endLineNumber) {
			this.ranges.push(new vscode.FoldingRange(line.lineNumber, endLineNumber, vscode.FoldingRangeKind.Region));
		}

		if (line.lineNumber === 0) {
			return;
		}

		const previousLine = document.lineAt(line.lineNumber - 1);
		const previousLineIndent = IstUtils.getIndent(previousLine.text);
		if (previousLineIndent === indent &&
			(IstUtils.isDialog(previousLine.text) || IstUtils.isNarrative(previousLine.text))) {
			const endBranchLineNumber = this.findNextNonBranchLine(document, previousLine.lineNumber + 1, previousLineIndent) - 1;
			if (previousLine.lineNumber < endBranchLineNumber) {
				this.ranges.push(new vscode.FoldingRange(previousLine.lineNumber, endBranchLineNumber, vscode.FoldingRangeKind.Region));
			}
		}
	}

	private findNextLine(document: vscode.TextDocument, startLine: number, indent: number): number {
		for (let i = startLine; i < document.lineCount; i++) {
			const currentLine = document.lineAt(i);
			if (currentLine.isEmptyOrWhitespace || IstUtils.isComment(currentLine.text)) {
				continue;
			}
			if (IstUtils.getIndent(currentLine.text) === indent) {
				return i;
			}
		}
		return document.lineCount;
	}

	private findNextNonBranchLine(document: vscode.TextDocument, startLine: number, indent: number): number {
		for (let i = startLine; i < document.lineCount; i++) {
			const currentLine = document.lineAt(i);
			if (currentLine.isEmptyOrWhitespace || IstUtils.isComment(currentLine.text)) {
				continue;
			}
			if (IstUtils.getIndent(currentLine.text) === indent &&
				IstUtils.isBranch(currentLine.text) === false) {
				return i;
			}
		}
		return document.lineCount;
	}
}