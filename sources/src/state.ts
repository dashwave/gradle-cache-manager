class AppState {
    private static instance: AppState;
    private state: { [key: string]: any } = {};
    private debugEnabled: boolean = false;
    private outputs: { [key: string]: any } = {};

    private constructor() {
        // Private constructor to prevent direct construction calls with the `new` operator.
    }

    public static getInstance(): AppState {
        if (!AppState.instance) {
            AppState.instance = new AppState();
        }
        return AppState.instance;
    }

    public get(key: string): any {
        return this.state[key];
    }

    public set(key: string, value: any): void {
        this.state[key] = value;
    }

    public isDebug(): boolean {
        return this.debugEnabled;
    }

    public addPath(key: string){

    }

    public setOutput(key: string, value: any){
        this.outputs[key] = value;
    }

    public getInput(key: string): string {
        return this.state[key];
    }

    public getMultilineInput(key: string): string[] {
        return this.state[key];
    }
}

const state = AppState.getInstance();
export default state;
