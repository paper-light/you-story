import type { EnhanceOutput, ScenePolicy, ScenePlan } from './models';

export type OpenAIMessage = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

export interface Enhancer {
	enhance(query: string): Promise<EnhanceOutput>;
}

export interface ScenePlanner {
	plan(policy: ScenePolicy): Promise<ScenePlan>;
}

export interface SceneActor {
	act(plan: ScenePlan, idx: number): Promise<string>;
	actStream(plan: ScenePlan, idx: number): ReadableStream<string>;
}
