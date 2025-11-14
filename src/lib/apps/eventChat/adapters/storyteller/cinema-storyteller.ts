import type z from 'zod';

import { zodResponseFormat } from 'openai/helpers/zod.js';
import { observeOpenAI } from '@langfuse/openai';
import type { Story } from '$lib/apps/story/core';
import type { StoryEvent } from '$lib/apps/storyEvent/core';
import type { CharactersResponse, MessagesResponse } from '$lib';

import { grok } from '$lib/shared/server';

import { SchemaScenePlan, type MessageChunk, type EventChat, type Storyteller } from '../../core';

import { PLAN_PROMPT, GENERATE_PROMPT } from './prompts';

type OpenAIMessage = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

export const STORYTELLER_MODEL = 'grok-4-fast-non-reasoning';
// export const STORYTELLER_MODEL = 'grok-4-fast';

class CinemaStoryteller implements Storyteller {
	async planScene(
		story: Story,
		storyEvent: StoryEvent,
		chat: EventChat,
		userMsg: MessagesResponse
	): Promise<z.infer<typeof SchemaScenePlan>> {
		const chars = storyEvent.getCharacters();

		const messages = this.buildMessages(story, storyEvent, chat, chars, userMsg);
		messages.push(...this.buildPlanMessages());

		const grokLf = observeOpenAI(grok, {
			traceName: 'storyteller-plan'
		});

		const completion = await grokLf.chat.completions.create({
			model: STORYTELLER_MODEL,
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

		const messages = this.buildMessages(story, storyEvent, chat, chars, userMsg);
		messages.push(...this.buildGenMessages(plan));

		const grokLf = observeOpenAI(grok, {
			traceName: 'storyteller-generate'
		});

		return new ReadableStream<MessageChunk>({
			start: async (controller) => {
				const completion = await grokLf.chat.completions.create({
					model: STORYTELLER_MODEL,
					messages,
					stream: true
				});

				for await (const chunk of completion) {
					const text = chunk.choices[0].delta.content || '';
					if (text) {
						controller.enqueue({ text, msgId: aiMsg.id });
					}
				}

				controller.close();
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
		messages.push({
			role: 'system',
			content:
				'Previous steps in the scene:\n' +
				plan.steps
					.map((step) => `- ${step.type} (${step.characterId || 'world'}): ${step.description}`)
					.join('\n')
		});
		messages.push({
			role: 'system',
			content: `Current scene plan:\n${lastStep?.type} (${lastStep?.characterId || 'world'}): ${lastStep?.description || ''}`
		});
		return messages;
	}

	private buildMessages(
		story: Story,
		storyEvent: StoryEvent,
		chat: EventChat,
		chars: CharactersResponse[],
		userMsg: MessagesResponse
	): OpenAIMessage[] {
		const messages: OpenAIMessage[] = [];
		messages.push({ role: 'user', content: story.prompt });
		messages.push({ role: 'user', content: storyEvent.prompt });

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
			role: 'system',
			content:
				'Available characters:\n' +
				chars.map((char) => `- ${char.name} ${char.age} (${char.id})`).join('\n')
		});

		const notes = chat.data.notes || [];
		if (notes.length > 0)
			messages.push({ role: 'system', content: 'Additional User instructions for the scene:\n' });
		for (const note of notes) messages.push({ role: 'user', content: note });

		messages.push({
			role: 'user',
			content: `User query: ${userMsg.content}`
		});

		return messages;
	}
}

export const storyteller = new CinemaStoryteller();
