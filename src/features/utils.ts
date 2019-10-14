import * as vscode from 'vscode';
import { BRANCH_PREFIX, COMMAND_PREFIX, DIALOG_PREFIXES, COMMENT_PREFIX } from './consts';

export default class IstUtils {
	public static getIndent(line: string): number {
		if (line[0] !== ' ' && line[0] !== '\t') {
			return 0;
		}

		if (line[0] === '\t') {
			return 1 + IstUtils.getIndent(line.substr(1));
		}

		if (line.substr(0, 4) === "    ") {
			return 1 + IstUtils.getIndent(line.substr(4));
		}

		// Error indent here.
		return 0;
	}

	public static isBranch(line: string): boolean {
		const trimmed = line.trim();
		if (trimmed.length === 0) {
			return false;
		}
		return trimmed[0] === BRANCH_PREFIX;
	}

	public static isCommand(line: string): boolean {
		const trimmed = line.trim();
		if (trimmed.length === 0) {
			return false;
		}
		return trimmed[0] === COMMAND_PREFIX;
	}

	public static isComment(line: string): boolean {
		const trimmed = line.trim();
		if (trimmed.length === 0) {
			return false;
		}
		return trimmed[0] === COMMENT_PREFIX;
	}

	public static isNarrative(line: string): boolean {
		const trimmed = line.trim();
		if (trimmed.length === 0) {
			return false;
		}

		if (this.isBranch(line) || this.isCommand(line) || this.isComment(line)) {
			return false;
		}

		if (DIALOG_PREFIXES.indexOf(trimmed[0]) !== -1) {
			return false;
		}
		
		for (let i = 1; i < trimmed.length; i++) {
			const currentChar = trimmed[i];
			const previousChar = trimmed[i - 1];
			if (DIALOG_PREFIXES.indexOf(currentChar) !== -1 && previousChar !== '\\') {
				return false;
			}
		}
		return true;
	}

	public static isDialog(line: string): boolean {
		const trimmed = line.trim();
		if (trimmed.length === 0) {
			return false;
		}

		if (this.isBranch(line) || this.isCommand(line) || this.isComment(line)) {
			return false;
		}

		if (DIALOG_PREFIXES.indexOf(trimmed[0]) !== -1) {
			return true;
		}
		
		for (let i = 1; i < trimmed.length; i++) {
			const currentChar = trimmed[i];
			const previousChar = trimmed[i - 1];
			if (DIALOG_PREFIXES.indexOf(currentChar) !== -1 && previousChar !== '\\') {
				return true;
			}
		}
		return false;
	}

	public static getBranchText(line: string): string {
		return line.trim().substr(1).trim();
	}
}