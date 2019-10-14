import * as vscode from 'vscode';

import IstUtils from './utils';
import { BRANCH_PREFIX } from './consts';
import { IstBranchExtractor } from './branchExtractor';

export default class IstDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
	provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
		const extractor = new IstBranchExtractor();
		extractor.extract(document);
		
		let symbols = [];
		for (let branchIndex = 0; branchIndex < extractor.branches.length; branchIndex++) {
			const branch = extractor.branches[branchIndex];
			const branchLocation = this.createLocation(document, branch.startLine, branch.endLine);
			symbols.push(new vscode.SymbolInformation(branch.text, vscode.SymbolKind.Class, '', branchLocation));
			for (let optionIndex = 0; optionIndex < branch.options.length; optionIndex++) {
				const option = branch.options[optionIndex];
				const optionLocation = this.createLocation(document, option.startLine, option.endLine);
				symbols.push(new vscode.SymbolInformation(option.text, vscode.SymbolKind.Function, '', optionLocation));
			}
		}
		return symbols;
	}

	private createLocation(document: vscode.TextDocument, startLine: number, endLine: number): vscode.Location {
		const end = document.lineAt(endLine);
		return new vscode.Location(document.uri, new vscode.Range(startLine, 0, endLine, end.text.length));
	}
}