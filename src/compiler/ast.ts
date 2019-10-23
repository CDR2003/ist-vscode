export class IstStmt {
    constructor(public line: number) {
    }
}

export class IstCommandStmt extends IstStmt {
}

export class IstBranchOptionStmt extends IstStmt {
    public children: IstStmt[] = [];
    public branch: IstNarrativeStmt | IstDialogStmt | undefined = undefined;
    constructor(line: number, public text: string) {
        super(line);
    }

    public getLastStmt(): IstStmt {
        const lastChild = this.children[this.children.length - 1];
        if (lastChild instanceof IstBranchStmt) {
            return lastChild.getLastStmt();
        } else if (lastChild instanceof IstBranchOptionStmt) {
            return lastChild.getLastStmt();
        } else {
            return lastChild;
        }
    }
}

export class IstNarrativeStmt extends IstStmt {
    constructor(line: number, public text: string) {
        super(line);
    }
}

export class IstDialogStmt extends IstStmt {
    public character: string | undefined = undefined;
    public emotion: string | undefined = undefined;
    public text: string = "";
    public monologue: boolean = false;
    constructor(line: number) {
        super(line);
    }
}

export class IstBranchStmt extends IstStmt {
    public options: IstBranchOptionStmt[] = [];
    constructor(line: number, public text: string) {
        super(line);
    }

    public getLastStmt(): IstStmt {
        const lastOption = this.options[this.options.length - 1];
        return lastOption.getLastStmt();
    }
}