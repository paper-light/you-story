import type z from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod.js';
import { observeOpenAI } from '@langfuse/openai';

import type { EventChat } from '$lib/apps/eventChat/core';
import type { MessagesResponse } from '$lib/shared';

import { grok, LLMS } from '$lib/shared/server';

import type { ScenePlanner } from '../../core';
import { SchemaScenePlan } from '../../core';
import { PLAN_PROMPT } from './prompts';

export const SCENE_PLANNER_MODEL = LLMS.GROK_4_FAST;

type OpenAIMessage = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

class OpenAIScenePlanner implements ScenePlanner {
	async plan(
		chat: EventChat,
		userMsg: MessagesResponse,
		preMessages: OpenAIMessage[],
		sessionId: string,
		userId: string
	): Promise<z.infer<typeof SchemaScenePlan>> {
		const messages = [...preMessages];
		messages.push({ role: 'system', content: PLAN_PROMPT });

		messages.push(...this.postBuildMessages(chat));
		messages.push({
			role: 'user',
			content: `
(${userMsg?.character || 'World'}) message: 
${userMsg.content}
`
		});

		const grokLf = observeOpenAI(grok, {
			traceName: 'scene',
			sessionId,
			userId
		});

		const completion = await grokLf.chat.completions.create({
			model: SCENE_PLANNER_MODEL,
			messages,
			response_format: zodResponseFormat(SchemaScenePlan, 'scene_steps')
		});

		return SchemaScenePlan.parse(JSON.parse(completion.choices[0].message.content || '{}'));
	}

	private postBuildMessages(chat: EventChat): OpenAIMessage[] {
		const messages: OpenAIMessage[] = [];

		const notes = chat.data.notes || [];
		if (notes.length > 0)
			messages.push({ role: 'system', content: 'Additional User instructions for the scene:\n' });
		for (const note of notes) messages.push({ role: 'user', content: note });

		const chatMessages = chat.getMessages();
		if (chatMessages.length > 0) messages.push({ role: 'system', content: 'Chat history:\n' });
		for (const msg of chatMessages) {
			const role: 'user' | 'assistant' = msg.role === 'user' ? 'user' : 'assistant';
			messages.push({
				role,
				content: msg.content
			});
		}

		return messages;
	}
}

export const scenePlanner = new OpenAIScenePlanner();
