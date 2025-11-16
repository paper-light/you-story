import type { EnhanceOutput, ScenePlan, ScenePolicy } from './models';

export interface SceneApp {
	enhanceQuery(query: string): Promise<EnhanceOutput>;
	getPolicy(enhance: EnhanceOutput): Promise<ScenePolicy>;

	plan(policy: ScenePolicy): Promise<ScenePlan>;

	act(plan: ScenePlan, idx: number): Promise<string>;
	actStream(plan: ScenePlan, idx: number): ReadableStream<string>;
}
