import { observeOpenAI } from '@langfuse/openai';

import { grok, LLMS } from '$lib/shared/server';

import type { OpenAIMessage, ScenePlan } from '../../core';
import type { SceneActor } from '../../core';

import { PERFORM_WORLD_PROMPT, PERFORM_THOUGHTS_PROMPT, PERFORM_SPEECH_PROMPT } from './prompts';

export const SCENE_ACTOR_MODEL = LLMS.GROK_4_FAST_NON_REASONING;

class OpenAISceneActor implements SceneActor {
	async act(plan: ScenePlan, idx: number): Promise<string> {
		const messages = this.postBuildMessages(plan, idx);
		const grokLf = observeOpenAI(grok);

		const completion = await grokLf.chat.completions.create({
			model: SCENE_ACTOR_MODEL,
			messages
		});

		return completion.choices[0].message.content || '';
	}

	actStream(plan: ScenePlan, idx: number): ReadableStream<string> {
		const messages = this.postBuildMessages(plan, idx);
		const grokLf = observeOpenAI(grok);

		return new ReadableStream<string>({
			start: async (controller) => {
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
				} catch (error) {
					controller.error(error);
				}
			}
		});
	}

	private postBuildMessages(plan: ScenePlan, idx: number): OpenAIMessage[] {
		const messages: OpenAIMessage[] = [];

		const step = plan.steps[idx];
		const prevSteps = plan.steps.slice(0, idx);

		const notes: string[] = [];
		if (notes.length > 0)
			messages.push({ role: 'system', content: 'Additional User instructions for the scene:\n' });
		for (const note of notes) messages.push({ role: 'user', content: note });

		const chatMessages: OpenAIMessage[] = [];
		if (chatMessages.length > 0) messages.push({ role: 'system', content: 'Chat history:\n' });
		for (const msg of chatMessages) messages.push(msg);

		if (prevSteps.length > 0) {
			messages.push({
				role: 'system',
				content:
					'Previous steps in the scene:\n' +
					prevSteps
						.map((step) => `- ${step.type} (${step.characterId || ''}): ${step.description}`)
						.join('\n')
			});
		}
		messages.push({
			role: 'system',
			content: `Current scene plan:\n${step.type} (${step.characterId || 'world'}): ${step.description}`
		});

		if (step.type === 'world') {
			messages.push({ role: 'system', content: PERFORM_WORLD_PROMPT });
		} else if (step.type === 'thoughts') {
			messages.push({ role: 'system', content: PERFORM_THOUGHTS_PROMPT });
		} else if (step.type === 'speech') {
			messages.push({ role: 'system', content: PERFORM_SPEECH_PROMPT });
		}

		return messages;
	}
}

export const openaiSceneActor = new OpenAISceneActor();
