import type { MemporyGetResult } from '$lib/apps/memory/core';

import type { EnhanceOutput, ScenePlan, ScenePolicy } from './models';

import type { OpenAIMessage } from './out';

export type ActCmd = {
	plan: ScenePlan;
	idx: number;
	scenePolicy: ScenePolicy;
	history: OpenAIMessage[];
};
export interface SceneApp {
	enhanceQuery(history: OpenAIMessage[]): Promise<EnhanceOutput>;
	getPolicy(enhance: EnhanceOutput): Promise<ScenePolicy>;

	plan(policy: ScenePolicy, mems: MemporyGetResult, history: OpenAIMessage[]): Promise<ScenePlan>;

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
