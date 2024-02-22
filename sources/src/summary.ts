class BuildSummary {
    private _summary: string[] = []
    private static instance: BuildSummary;
    
    public static getInstance(): BuildSummary {
        if (!BuildSummary.instance) {
            BuildSummary.instance = new BuildSummary();
        }
        return BuildSummary.instance;
    }

    addRaw(text: string): void {
        this._summary.push(text)
    }

    async write(): Promise<void> {
        
    }
}

const summary = BuildSummary.getInstance()
export default summary