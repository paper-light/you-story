import { observeOpenAI } from '@langfuse/openai';

import { grok, LLMS } from '$lib/shared/server';
import type { MemporyGetResult } from '$lib/apps/memory/core';

import type { OpenAIMessage, ScenePlan } from '../../core';
import type { SceneActor } from '../../core';

import {
	PERFORM_WORLD_PROMPT,
	PERFORM_THOUGHTS_PROMPT,
	PERFORM_SPEECH_PROMPT,
	FRIEND_PROMPT
} from './prompts';

export const SCENE_ACTOR_MODEL = LLMS.GROK_4_FAST_NON_REASONING;
const MAX_RETRIES = 5;

class OpenAISceneActor implements SceneActor {
	async act(
		kind: 'friend' | 'story',
		plan: ScenePlan,
		idx: number,
		mems: MemporyGetResult,
		history: OpenAIMessage[]
	): Promise<string> {
		const messages = this.postBuildMessages(kind, plan, idx, mems, history);
		const grokLf = observeOpenAI(grok);

		let lastError: Error | unknown;
		for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
			try {
				const completion = await grokLf.chat.completions.create({
					model: SCENE_ACTOR_MODEL,
					messages
				});

				return completion.choices[0].message.content || '';
			} catch (error) {
				lastError = error;
				if (attempt === MAX_RETRIES - 1) {
					throw error;
				}
			}
		}

		throw lastError;
	}

	actStream(
		kind: 'friend' | 'story',
		plan: ScenePlan,
		idx: number,
		mems: MemporyGetResult,
		history: OpenAIMessage[]
	): ReadableStream<string> {
		const messages = this.postBuildMessages(kind, plan, idx, mems, history);
		const grokLf = observeOpenAI(grok);

		return new ReadableStream<string>({
			start: async (controller) => {
				let lastError: Error | unknown;
				for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
					try {
						const completion = await grokLf.chat.completions.create({
							model: SCENE_ACTOR_MODEL,
							messages,
							stream: true,
							stream_options: { include_usage: true }
						});

						for await (const chunk of completion) {
							if (chunk.choices && chunk.choices.length > 0 && chunk.choices[0]?.delta) {
								const text = chunk.choices[0].delta.content || '';
								if (text) controller.enqueue(text);
							}
						}

						controller.close();
						return;
					} catch (error) {
						lastError = error;
						if (attempt === MAX_RETRIES - 1) {
							controller.error(error);
							return;
						}
					}
				}

				controller.error(lastError);
			}
		});
	}

	private postBuildMessages(
		kind: 'friend' | 'story',
		plan: ScenePlan,
		idx: number,
		mems: MemporyGetResult,
		history: OpenAIMessage[]
	): OpenAIMessage[] {
		const messages: OpenAIMessage[] = [];

		// STATIC MEMORIES
		if (mems.static.length > 0) {
			const parts = [];
			messages.push({ role: 'system', content: 'General information:\n' });
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
			const parts = [];
			messages.push({ role: 'system', content: 'Event memories:\n' });
			for (const mem of mems.event) {
				parts.push(`- ${mem.content}`);
			}
			messages.push({ role: 'user', content: parts.join('\n') });
		}

		if (mems.profile.length > 0) {
			const parts = [];
			messages.push({ role: 'system', content: 'Profile memories:\n' });
			for (const mem of mems.profile) {
				parts.push(`- ${mem.content}`);
			}
			messages.push({ role: 'user', content: parts.join('\n') });
		}

		const step = plan.steps[idx];
		const prevSteps = plan.steps.slice(0, idx);

		if (prevSteps.length > 0) {
			const parts = [];
			parts.push({
				role: 'system',
				content: 'Previous steps in the scene:\n'
			});

			for (const step of prevSteps) {
				parts.push(`- ${step.type} (${step.characterId || ''}): ${step.description}`);
			}
			messages.push({ role: 'system', content: parts.join('\n') });
		}
		messages.push({
			role: 'system',
			content: `Current scene plan:\n${step.type} (${step.characterId || 'world'}): ${step.description}`
		});

		const charStatic = mems.static.find((mem) => mem.characterId === step.characterId)?.content;
		if (kind === 'friend') {
			messages.push({
				role: 'system',
				content: FRIEND_PROMPT.replaceAll('{character}', charStatic!)
			});
		} else if (step.type === 'world') {
			messages.push({ role: 'system', content: PERFORM_WORLD_PROMPT });
		} else if (step.type === 'thoughts') {
			messages.push({
				role: 'system',
				content: PERFORM_THOUGHTS_PROMPT.replaceAll('{character}', charStatic!).replaceAll(
					'{name}',
					step.characterId!
				)
			});
		} else if (step.type === 'speech') {
			messages.push({
				role: 'system',
				content: PERFORM_SPEECH_PROMPT.replaceAll('{character}', charStatic!).replaceAll(
					'{name}',
					step.characterId!
				)
			});
		}

		return messages;
	}
}

export const openaiSceneActor = new OpenAISceneActor();
