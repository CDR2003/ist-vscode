import { COMMENT_PREFIX, COMMAND_PREFIX, BRANCH_PREFIX, DIALOG_PREFIXES, MONOLOGUE_PREFIXES, MONOLOGUE_SUFFIXES, EMOTION_PREFIX } from "./consts";
import IstCompilerError from "./compilerError";
import { IstStmt, IstBranchOptionStmt, IstNarrativeStmt, IstDialogStmt, IstBranchStmt } from "./ast";
import { TextDocument } from "vscode";

export default class IstCompiler {
    public stmts: IstStmt[] = [];
    public errors: IstCompilerError[] = [];

    currentIndent: number = 0;
    previousIndent: number = 0;
    previousStmt: IstStmt | undefined = undefined;
    lastStmts: Map<number, IstStmt> = new Map<number, IstStmt>();

    public compileDocument(document: TextDocument): void {
        let lines = [];
        for (let i = 0; i < document.lineCount; i++) {
            lines.push(document.lineAt(i).text);
        }
        this.compileLines(lines);
    }

    public compileLines(lines: string[]): void {
        for (let i = 0; i < lines.length; i++) {
            const text = lines[i];
            this.compileLine(text, i);
        }

        this.replaceBranchForOptions(this.stmts, 0);
    }

    private replaceBranchForOptions(stmts: IstStmt[], startIndex: number): void {
        const firstOptionIndex = this.findFirstOptionIndex(stmts, startIndex);
        if (firstOptionIndex === -1) {
            return;
        }

        const firstOption = <IstBranchOptionStmt>stmts[firstOptionIndex];
        const lastNarrativeIndex = this.findLastNarrativeIndex(stmts, firstOptionIndex);
        if (lastNarrativeIndex === -1) {
            this.addError("Previous narrative cannot be found as a branch for this option.", firstOption.line);
            return;
        }

        const narrative = <IstNarrativeStmt>stmts[lastNarrativeIndex];
        const branch = new IstBranchStmt(narrative.line, narrative.text);
        branch.options.push(firstOption);
        stmts[lastNarrativeIndex] = branch;

        for (let i = firstOptionIndex + 1; i < stmts.length; i++) {
            const stmt = stmts[i];
            if (stmt instanceof IstBranchOptionStmt === false) {
                this.replaceBranchForOptions(stmts, i);
                break;
            }

            const option = <IstBranchOptionStmt>stmt;
            branch.options.push(option);
        }

        for (let i = 0; i < branch.options.length; i++) {
            const option = branch.options[i];
            this.replaceBranchForOptions(option.children, 0);
        }

        for (let i = branch.options.length - 1; i >= 0; i--) {
            const index = stmts.indexOf(branch.options[i]);
            stmts.splice(index, 1);
        }
    }

    private findFirstOptionIndex(stmts: IstStmt[], startIndex: number): number {
        for (let i = startIndex; i < stmts.length; i++) {
            if (stmts[i] instanceof IstBranchOptionStmt) {
                return i;
            }
        }
        return -1;
    }

    private findLastNarrativeIndex(stmts: IstStmt[], endIndex: number): number {
        for (let i = endIndex - 1; i >= 0; i--) {
            const stmt = stmts[i];
            if (stmt instanceof IstNarrativeStmt) {
                return i;
            }
        }
        return -1;
    }

    private compileLine(text: string, line: number): void {
        const trimmed = text.trim();

        // Empty
        if (trimmed === "") {
            return;
        }

        // Comment
        if (trimmed.startsWith(COMMENT_PREFIX)) {
            return;
        }

        this.previousIndent = this.currentIndent;
        this.currentIndent = this.getIndent(text, line);
        this.checkIndent(line);

        // Command
        if (trimmed.startsWith(COMMAND_PREFIX)) {
            this.compileCommand(trimmed, line);
            return;
        }

        // Option
        if (trimmed.startsWith(BRANCH_PREFIX)) {
            this.compileBranchOption(trimmed, line);
            return;
        }

        // Narrative
        if (this.isNarrative(trimmed)) {
            this.compileNarrative(trimmed, line);
            return;
        }

        this.compileDialog(trimmed, line);
    }

    private compileCommand(trimmed: string, line: number): void {
    }

    private compileBranchOption(trimmed: string, line: number) {
        const text = trimmed.substring(1).trim();
        this.addStmt(new IstBranchOptionStmt(line, text));
    }

    private compileNarrative(trimmed: string, line: number) {
        this.addStmt(new IstNarrativeStmt(line, trimmed));
    }

    private compileDialog(trimmed: string, line: number): void {
        const dialogPrefixIndex = this.findFirstDialogIndex(trimmed);

        const stmt = new IstDialogStmt(line);

        const dialog = trimmed.substring(dialogPrefixIndex + 1).trim();
        if (MONOLOGUE_PREFIXES.indexOf(dialog[0]) !== -1 && MONOLOGUE_SUFFIXES.indexOf(dialog[dialog.length - 1]) !== -1) {
            const monologue = dialog.substring(1, dialog.length - 1);
            stmt.text = monologue;
            stmt.monologue = true;
        } else {
            stmt.text = dialog;
        }

        const characterAndEmotion = trimmed.substring(0, dialogPrefixIndex).trim();
        if (characterAndEmotion === "") {
            // : Dialog
        } else {
            const emotionIndex = characterAndEmotion.indexOf(EMOTION_PREFIX);
            if (emotionIndex === -1) {
                // Character: Dialog
                stmt.character = characterAndEmotion;
            } else if (emotionIndex === 0) {
                // @Emotion: Dialog
                stmt.emotion = characterAndEmotion.substring(1).trim();
            } else {
                // Character@Emotion: Dialog
                stmt.character = characterAndEmotion.substring(0, emotionIndex).trim();
                stmt.emotion = characterAndEmotion.substring(emotionIndex + 1).trim();
            }
        }

        this.addStmt(stmt);
    }

    private findFirstDialogIndex(trimmed: string) {
        let minIndex = Number.MAX_SAFE_INTEGER;
        for (let i = 0; i < DIALOG_PREFIXES.length; i++) {
            const prefix = DIALOG_PREFIXES[i];
            const index = trimmed.indexOf(prefix);
            if (index === -1) {
                continue;
            }
            if (index < minIndex) {
                minIndex = index;
            }
        }
        return minIndex;
    }

    private isNarrative(trimmed: string): boolean {
        if (DIALOG_PREFIXES.indexOf(trimmed[0]) !== -1) {
            return false;
        }

        for (let i = 1; i < trimmed.length; i++) {
            const currentChar = trimmed[i];
            const previousChar = trimmed[i - 1];
            if (DIALOG_PREFIXES.indexOf(currentChar) !== -1 && previousChar !== "\\") {
                return false;
            }
        }

        return true;
    }

    private getIndent(text: string, line: number): number {
        if (text[0] !== ' ' && text[0] !== '\t') {
            return 0;
        }

        if (text[0] === '\t') {
            return 1 + this.getIndent(text.substr(1), line);
        }

        if (text.substr(0, 4) === "    ") {
            return 1 + this.getIndent(text.substr(4), line);
        }

        // Error indent here.
        this.addError("Error indentation. Only tab and 4-spaces are allowed.", line);
        return 0;
    }

    private addStmt(stmt: IstStmt): void {
        for (let i = this.currentIndent + 1; i < this.previousIndent; i++) {
            this.lastStmts.delete(i);
        }

        this.previousStmt = stmt;

        if (this.currentIndent === 0) {
            this.stmts.push(stmt);
            this.lastStmts.set(0, stmt);
        } else {
            const parent = this.lastStmts.get(this.currentIndent - 1);
            if (parent !== undefined && parent instanceof IstBranchOptionStmt) {
                parent.children.push(stmt);
            }
            this.lastStmts.set(this.currentIndent, stmt);
        }
    }

    private checkIndent(line: number): void {
        if (this.previousStmt instanceof IstBranchOptionStmt === false) {
            return;
        }

        if (this.currentIndent > this.previousIndent && this.currentIndent !== this.previousIndent + 1) {
            this.addError("Exactly 1 identation should be added following a branch option.", line);
        }
    }

    private addError(message: string, line: number): void {
        this.errors.push(new IstCompilerError(message, line));
    }
}