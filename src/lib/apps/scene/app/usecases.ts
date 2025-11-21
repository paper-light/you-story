import type { MemporyGetResult } from '$lib/apps/memory/core';
import {
	type EnhanceOutput,
	type Enhancer,
	type SceneApp,
	getScenePolicy,
	type ScenePolicy,
	type ScenePlan,
	type ScenePlanner,
	type SceneActor,
	type OpenAIMessage
} from '../core';

export class SceneAppImpl implements SceneApp {
	constructor(
		private readonly enhancer: Enhancer,
		private readonly scenePlanner: ScenePlanner,
		private readonly sceneActor: SceneActor
	) {}

	// Prepare
	async enhanceQuery(history: OpenAIMessage[], mems: MemporyGetResult): Promise<EnhanceOutput> {
		const enhance = await this.enhancer.enhance(history, mems);
		return enhance;
	}
	async getPolicy(enhance: EnhanceOutput): Promise<ScenePolicy> {
		const scene = getScenePolicy(enhance);
		return scene;
	}

	// Plan
	async plan(
		policy: ScenePolicy,
		mems: MemporyGetResult,
		history: OpenAIMessage[]
	): Promise<ScenePlan> {
		const plan = await this.scenePlanner.plan(policy, mems, history);
		return plan;
	}

	// Act
	async act(
		kind: 'friend' | 'story',
		plan: ScenePlan,
		idx: number,
		mems: MemporyGetResult,
		history: OpenAIMessage[]
	): Promise<string> {
		const text = await this.sceneActor.act(kind, plan, idx, mems, history);
		return text;
	}
	actStream(
		kind: 'friend' | 'story',
		plan: ScenePlan,
		idx: number,
		mems: MemporyGetResult,
		history: OpenAIMessage[]
	): ReadableStream<string> {
		const stream = this.sceneActor.actStream(kind, plan, idx, mems, history);
		return stream;
	}
}
