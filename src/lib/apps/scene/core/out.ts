import type { MemporyGetResult } from '$lib/apps/memory/core';
import type { EnhanceOutput, ScenePolicy, ScenePlan } from './models';

export type OpenAIMessage = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

export interface Enhancer {
	enhance(history: OpenAIMessage[]): Promise<EnhanceOutput>;
}

export interface ScenePlanner {
	plan(policy: ScenePolicy, mems: MemporyGetResult, history: OpenAIMessage[]): Promise<ScenePlan>;
}

export interface SceneActor {
	act(
		kind: 'friend' | 'story',
		plan: ScenePlan,
		idx: number,
		mems: MemporyGetResult,
		history: OpenAIMessage[]
	): Promise<string>;
	actStream(
		kind: 'friend' | 'story',
		plan: ScenePlan,
		idx: number,
		mems: MemporyGetResult,
		history: OpenAIMessage[]
	): ReadableStream<string>;
}
