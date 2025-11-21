import { zodResponseFormat } from 'openai/helpers/zod.js';
import { observeOpenAI } from '@langfuse/openai';

import { grok, LLMS } from '$lib/shared/server';

import type { ScenePlanner, ScenePolicy, ScenePlan, OpenAIMessage } from '../../core';
import { SchemaScenePlan } from '../../core';

import { SCENE_PLAN_PROMPT } from './prompts';
import type { MemporyGetResult } from '$lib/apps/memory/core';

export const SCENE_PLANNER_MODEL = LLMS.GROK_4_FAST;
const MAX_RETRIES = 5;

export class OpenAIScenePlanner implements ScenePlanner {
	async plan(
		policy: ScenePolicy,
		mems: MemporyGetResult,
		history: OpenAIMessage[]
	): Promise<ScenePlan> {
		const messages: OpenAIMessage[] = [];

		// STATIC MEMORIES
		if (mems.static.length > 0) {
			messages.push({ role: 'system', content: 'General information:\n' });
			const parts = [];
			for (const mem of mems.static) {
				parts.push(`- ${mem.content}`);
			}
			messages.push({ role: 'user', content: parts.join('\n') });
		}

		// CHAT HISTORY
		if (history.length > 0) {
			messages.push({ role: 'system', content: 'Chat history:\n' });
			for (const msg of history) {
				messages.push(msg);
			}
		}

		// DYNAMIC MEMORIES
		if (mems.event.length > 0) {
			messages.push({ role: 'system', content: 'Event memories:\n' });
			const parts = [];
			for (const mem of mems.event) {
				parts.push(`- ${mem.content}`);
			}
			messages.push({ role: 'user', content: parts.join('\n') });
		}
		if (mems.profile.length > 0) {
			messages.push({ role: 'system', content: 'Profile memories:\n' });
			const parts = [];
			for (const mem of mems.profile) {
				parts.push(`- ${mem.content}`);
			}
			messages.push({ role: 'user', content: parts.join('\n') });
		}

		// POLICIES
		const systemParts = [];
		systemParts.push(this.compileSys(policy));
		systemParts.push('MUST FOLLOW THESE RULES FOR THE SCENE PLANNING:\n');
		systemParts.push(JSON.stringify(policy, null, 2));
		messages.push({ role: 'system', content: systemParts.join('\n') });

		const grokLf = observeOpenAI(grok);

		let lastError: Error | unknown;
		for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
			try {
				const completion = await grokLf.chat.completions.create({
					model: SCENE_PLANNER_MODEL,
					messages,
					response_format: zodResponseFormat(SchemaScenePlan, 'steps')
				});

				return SchemaScenePlan.parse(JSON.parse(completion.choices[0].message.content || '{}'));
			} catch (error) {
				lastError = error;
				if (attempt === MAX_RETRIES - 1) {
					throw error;
				}
			}
		}

		throw lastError;
	}

	private compileSys(policy: ScenePolicy): string {
		return SCENE_PLAN_PROMPT.replaceAll('{intent}', policy.intent)
			.replaceAll('{sceneFlowType}', policy.sceneFlowType)
			.replaceAll('{userEmotion}', policy.userEmotion)
			.replaceAll('{tempo}', policy.tempo)
			.replaceAll('{detailLevel}', policy.detailLevel)
			.replaceAll('{dialogueDensity}', policy.dialogueDensity)
			.replaceAll('{thoughtsDensity}', policy.thoughtsDensity)
			.replaceAll('{worldDensity}', policy.worldDensity)
			.replaceAll('{maxBeats}', policy.maxBeats.toString())
			.replaceAll('{maxBeatsPerActor}', policy.maxBeatsPerActor.toString());
	}
}
