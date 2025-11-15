import type z from 'zod';

import { zodResponseFormat } from 'openai/helpers/zod.js';
import { observeOpenAI } from '@langfuse/openai';
import type { Story } from '$lib/apps/story/core';
import type { StoryEvent } from '$lib/apps/storyEvent/core';
import type { CharactersResponse, MessagesResponse } from '$lib';

import { grok, LLMS } from '$lib/shared/server';

import { SchemaScenePlan, type MessageChunk, type EventChat, type Storyteller } from '../../core';

import { PLAN_PROMPT, GENERATE_PROMPT } from './prompts';

type OpenAIMessage = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

export const SCENE_PERFORMER_MODEL = LLMS.GROK_4_FAST_NON_REASONING;
export const SCENE_PLANNER_MODEL = LLMS.GROK_4_FAST;

class CinemaStoryteller implements Storyteller {
	async planScene(
		story: Story,
		storyEvent: StoryEvent,
		chat: EventChat,
		userMsg: MessagesResponse
	): Promise<z.infer<typeof SchemaScenePlan>> {
		const chars = storyEvent.getCharacters();

		const messages = this.preBuildMessages(story, storyEvent, chars);
		messages.push(...this.buildPlanMessages());
		messages.push(...this.postBuildMessages(chat, userMsg));

		const grokLf = observeOpenAI(grok, {
			traceName: 'scene'
		});

		const completion = await grokLf.chat.completions.create({
			model: SCENE_PLANNER_MODEL,
			messages,
			response_format: zodResponseFormat(SchemaScenePlan, 'scene_steps')
		});

		return SchemaScenePlan.parse(JSON.parse(completion.choices[0].message.content || '{}'));
	}

	generateSceneStep(
		story: Story,
		storyEvent: StoryEvent,
		chat: EventChat,
		plan: z.infer<typeof SchemaScenePlan>,
		userMsg: MessagesResponse,
		aiMsg: MessagesResponse
	): ReadableStream<MessageChunk> {
		const chars = storyEvent.getCharacters();

		const messages = this.preBuildMessages(story, storyEvent, chars);
		messages.push(...this.buildGenMessages(plan));
		messages.push(...this.postBuildMessages(chat, userMsg));

		const grokLf = observeOpenAI(grok);

		return new ReadableStream<MessageChunk>({
			start: async (controller) => {
				try {
					const completion = await grokLf.chat.completions.create({
						model: SCENE_PERFORMER_MODEL,
						messages,
						stream: true,
						stream_options: { include_usage: true }
					});

					for await (const chunk of completion) {
						// Check if chunk has choices and delta content
						// OpenAI returns usage in a final chunk with an empty choices list
						if (chunk.choices && chunk.choices.length > 0 && chunk.choices[0]?.delta) {
							const text = chunk.choices[0].delta.content || '';
							if (text) {
								controller.enqueue({ text, msgId: aiMsg.id });
							}
						}
					}

					controller.close();
				} catch (error) {
					controller.error(error);
				}
			}
		});
	}

	private buildPlanMessages(): OpenAIMessage[] {
		const messages: OpenAIMessage[] = [];
		messages.push({ role: 'system', content: PLAN_PROMPT });
		return messages;
	}

	private buildGenMessages(plan: z.infer<typeof SchemaScenePlan>): OpenAIMessage[] {
		const messages: OpenAIMessage[] = [];
		const lastStep = plan.steps.at(-1);
		messages.push({ role: 'system', content: GENERATE_PROMPT });

		const prevSteps = plan.steps.slice(0, -1);
		if (prevSteps.length > 0) {
			messages.push({
				role: 'system',
				content:
					'Previous steps in the scene:\n' +
					prevSteps
						.map((step) => `- ${step.type} (${step.characterId || 'world'}): ${step.description}`)
						.join('\n')
			});
		}

		messages.push({
			role: 'system',
			content: `Current scene plan:\n${lastStep?.type} (${lastStep?.characterId || 'world'}): ${lastStep?.description || ''}`
		});
		return messages;
	}

	private preBuildMessages(
		story: Story,
		storyEvent: StoryEvent,
		chars: CharactersResponse[]
	): OpenAIMessage[] {
		const messages: OpenAIMessage[] = [];
		messages.push({ role: 'user', content: story.prompt });
		messages.push({ role: 'user', content: storyEvent.prompt });

		messages.push({
			role: 'system',
			content:
				'Available characters:\n' +
				chars.map((char) => `- ${char.name} ${char.age} (${char.id})`).join('\n')
		});

		return messages;
	}

	private postBuildMessages(chat: EventChat, userMsg: MessagesResponse): OpenAIMessage[] {
		const messages: OpenAIMessage[] = [];

		const notes = chat.data.notes || [];
		if (notes.length > 0)
			messages.push({ role: 'system', content: 'Additional User instructions for the scene:\n' });
		for (const note of notes) messages.push({ role: 'user', content: note });

		// Add chat history
		const chatMessages = chat.getMessages();
		if (chatMessages.length > 0) messages.push({ role: 'system', content: 'Chat history:\n' });
		for (const msg of chatMessages) {
			const role: 'user' | 'assistant' = msg.role === 'user' ? 'user' : 'assistant';
			messages.push({
				role,
				content: msg.content
			});
		}

		messages.push({
			role: 'user',
			content: `User query: ${userMsg.content}`
		});

		return messages;
	}
}

export const storyteller = new CinemaStoryteller();
