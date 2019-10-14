import * as vscode from 'vscode';

import { IstBranchExtractor } from './branchExtractor';

export default class IstFoldingRangeProvider implements vscode.FoldingRangeProvider {
	provideFoldingRanges(document: vscode.TextDocument, context: vscode.FoldingContext, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FoldingRange[]> {
		const extractor = new IstBranchExtractor();
		extractor.extract(document);

		let ranges = [];
		for (let branchIndex = 0; branchIndex < extractor.branches.length; branchIndex++) {
			const branch = extractor.branches[branchIndex];
			ranges.push(new vscode.FoldingRange(branch.startLine, branch.endLine, vscode.FoldingRangeKind.Region));
			for (let optionIndex = 0; optionIndex < branch.options.length; optionIndex++) {
				const option = branch.options[optionIndex];
				ranges.push(new vscode.FoldingRange(option.startLine, option.endLine, vscode.FoldingRangeKind.Region));
			}
		}
		return ranges;
	}
}