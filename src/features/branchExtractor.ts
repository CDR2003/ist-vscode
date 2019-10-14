import * as vscode from 'vscode';
import IstUtils from './utils';

export class IstBranchExtractor {
	public branches: IstBranchInfo[] = [];
	public options: IstBranchOptionInfo[] = [];

	public extract(document: vscode.TextDocument): void {
		this.branches = [];
		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i);
			this.processLine(document, line);
		}
	}

	private processLine(document: vscode.TextDocument, line: vscode.TextLine) {
		if (line.isEmptyOrWhitespace) {
			return;
		}

		if (IstUtils.isBranch(line.text) === false) {
			return;
		}

		if (line.lineNumber === 0) {
			return;
		}

		const indent = IstUtils.getIndent(line.text);
		const previousLine = document.lineAt(line.lineNumber - 1);
		const previousLineIndent = IstUtils.getIndent(previousLine.text);
		if (previousLineIndent === indent &&
			(IstUtils.isDialog(previousLine.text) || IstUtils.isNarrative(previousLine.text))) {
			const endBranchLineNumber = this.findNextNonBranchLine(document, previousLine.lineNumber + 1, previousLineIndent) - 1;
			if (previousLine.lineNumber < endBranchLineNumber) {
				const branch = new IstBranchInfo(previousLine.text.trim(), previousLine.lineNumber, endBranchLineNumber);
				this.branches.push(branch);
			}
		}

		if (this.branches.length === 0) {
			return;
		}

		const lastBranch = this.branches[this.branches.length - 1];
		const endLineNumber = this.findNextLine(document, line.lineNumber + 1, indent) - 1;
		if (line.lineNumber < endLineNumber) {
			const option = new IstBranchOptionInfo(IstUtils.getBranchText(line.text), line.lineNumber, endLineNumber);
			lastBranch.options.push(option);
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


export class IstBranchInfo {
	public options: IstBranchOptionInfo[] = [];
	constructor(readonly text: string, readonly startLine: number, readonly endLine: number) {
	}
}


export class IstBranchOptionInfo {
	constructor(readonly text: string, readonly startLine: number, readonly endLine: number) {
	}
}