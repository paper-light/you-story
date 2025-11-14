import type { Story } from '$lib/apps/story/core';
import type { StoryEvent } from '$lib/apps/storyEvent/core';
import type { CharactersResponse } from '$lib';

import { grok } from '$lib/shared/server';

import type { EventChat, MessageChunk, Storyteller } from '../../core';

type OpenAIMessage = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

export const STORYTELLER_MODEL = 'grok-4-fast-non-reasoning';

export const PRE_SYSTEM_PROMPT = `
You are a storyteller. You are playing a role game with the user. You are to tell the story of the story event.
You are to use the characters in the story event to create a story.
`;

export const POST_SYSTEM_PROMPT = `
Available characters to use:
{characters}
`;

class StorytellerAdapter implements Storyteller {
	streamStory(story: Story, storyEvent: StoryEvent, chat: EventChat): ReadableStream<MessageChunk> {
		const availableCharacters = storyEvent
			.getCharacters()
			.filter((char) => char.id !== chat.data.povCharacter);

		return new ReadableStream({
			start: async (controller) => {
				try {
					const messages = this.buildMessages(story, storyEvent, chat, availableCharacters);

					const completion = await grok.chat.completions.create({
						model: STORYTELLER_MODEL,
						messages,
						stream: true
					});

					for await (const chunk of completion) {
						const text = chunk.choices[0].delta.content || '';
						if (text) {
							controller.enqueue({
								text,
								msgId: '' // will be set by usecase
							});
						}
					}

					controller.close();
				} catch (error) {
					controller.error(error);
				}
			}
		});
	}

	private buildMessages(
		story: Story,
		storyEvent: StoryEvent,
		chat: EventChat,
		availableCharacters: CharactersResponse[]
	): OpenAIMessage[] {
		const messages: OpenAIMessage[] = [];
		messages.push({ role: 'system', content: story.prompt });
		messages.push({ role: 'system', content: PRE_SYSTEM_PROMPT });

		messages.push({ role: 'system', content: storyEvent.prompt });
		messages.push({
			role: 'system',
			content: this.buildPostSystemPrompt(availableCharacters)
		});

		// Add chat history
		const chatMessages = chat.getMessages().slice(200);
		for (const msg of chatMessages) {
			if (msg.content.length === 0) continue;

			const role: 'user' | 'assistant' = msg.role === 'user' ? 'user' : 'assistant';
			messages.push({
				role,
				content: msg.content
			});
		}

		return messages;
	}

	private buildPostSystemPrompt(availableCharacters: CharactersResponse[]): string {
		return POST_SYSTEM_PROMPT.replace(
			'{characters}',
			availableCharacters.map((char) => `${char.name}, Age: ${char.age}`).join(', ')
		);
	}
}

export const storyteller = new StorytellerAdapter();
