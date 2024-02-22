import * as fs from 'fs';
import * as yaml from 'js-yaml';
import path from 'path';

import logger from './logger';

class AppState {
    private static instance: AppState
    private state: {[key: string]: any} = {}
    private debugEnabled: boolean = true
    private outputs: {[key: string]: any} = {}
    private inputs: {[key: string]: any} = {}

    private constructor() {
        this.debugEnabled = true
        // read input from config file

        const inputs = loadYAMLConfig('./config/input.yaml');
        logger.info(`Inputs: ${JSON.stringify(inputs)}`);

        this.inputs = inputs;
    }

    public static getInstance(): AppState {
        if (!AppState.instance) {
            AppState.instance = new AppState()
        }
        return AppState.instance
    }

    public get(key: string): any {
        return this.state[key]
    }

    public set(key: string, value: any): void {
        this.state[key] = value
    }

    public isDebug(): boolean {
        return this.debugEnabled
    }

    public addPath(key: string) {}

    public setOutput(key: string, value: any) {
        this.outputs[key] = value
    }

    public getInput(key: string): string {
        return this.inputs[key]
    }

    public getMultilineInput(key: string): string[] {
        return this.inputs[key]
    }
}

const state = AppState.getInstance()
export default state

interface InputConfig {
    [key: string]: any; // Adjust the type according to your expected values
}

function loadYAMLConfig(filePath: string): InputConfig {
    try {
    const filepath = path.resolve(__dirname,"../../../sources/src", filePath);
      const fileContents = fs.readFileSync(filepath, 'utf8');
      const data = yaml.load(fileContents) as { inputs?: InputConfig };
      
      const inputs = data.inputs || {};
      return inputs;
    } catch (e) {
      console.error('Error reading or parsing the YAML file:', e);
      return {};
    }
  }