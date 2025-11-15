import type z from 'zod';
import { observeOpenAI } from '@langfuse/openai';

import { grok, LLMS } from '$lib/shared/server';
import type { MessageExpand, MessagesResponse } from '$lib/shared';

import type {
	EventChat,
	MessageChunk,
	ScenePerformer,
	OpenAIMessage,
	MessageMetadata
} from '../../core';
import { SchemaScenePlan } from '../../core';
import { PERFORM_WORLD_PROMPT, PERFORM_THOUGHTS_PROMPT, PERFORM_SPEECH_PROMPT } from './prompts';

export const SCENE_PERFORMER_MODEL = LLMS.GROK_4_FAST_NON_REASONING;

class OpenAIScenePerformer implements ScenePerformer {
	perform(
		chat: EventChat,
		plan: z.infer<typeof SchemaScenePlan>,
		userMsg: MessagesResponse,
		aiMsg: MessagesResponse,
		preMessages: OpenAIMessage[]
	): ReadableStream<MessageChunk> {
		const messages = [...preMessages];

		const prevSteps = plan.steps.slice(0, -1);
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

		const lastStep = plan.steps.at(-1);
		messages.push({
			role: 'system',
			content: `Current scene plan:\n${lastStep?.type} (${lastStep?.characterId || 'world'}): ${lastStep?.description || ''}`
		});

		if (lastStep?.type === 'world') {
			messages.push({ role: 'system', content: PERFORM_WORLD_PROMPT });
		} else if (lastStep?.type === 'character-thoughts') {
			messages.push({ role: 'system', content: PERFORM_THOUGHTS_PROMPT });
		} else if (lastStep?.type === 'character-speech') {
			messages.push({ role: 'system', content: PERFORM_SPEECH_PROMPT });
		}

		messages.push(...this.postBuildMessages(chat));

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
						if (chunk.choices && chunk.choices.length > 0 && chunk.choices[0]?.delta) {
							const text = chunk.choices[0].delta.content || '';
							if (text) controller.enqueue({ text, msgId: aiMsg.id });
						}
					}

					controller.close();
				} catch (error) {
					controller.error(error);
				}
			}
		});
	}

	private postBuildMessages(chat: EventChat): OpenAIMessage[] {
		const messages: OpenAIMessage[] = [];

		const notes = chat.data.notes || [];
		if (notes.length > 0)
			messages.push({ role: 'system', content: 'Additional User instructions for the scene:\n' });
		for (const note of notes) messages.push({ role: 'user', content: note });

		const chatMessages: MessagesResponse<MessageMetadata, MessageExpand>[] = chat.getMessages();
		if (chatMessages.length > 0) messages.push({ role: 'system', content: 'Chat history:\n' });
		for (const msg of chatMessages) {
			const role: 'user' | 'assistant' = msg.role === 'user' ? 'user' : 'assistant';
			messages.push({
				role,
				content: `
${msg.expand?.character?.name || ''} (${msg.metadata?.step?.type || ''}): 
${msg.content}
				`
			});
		}

		return messages;
	}
}

export const scenePerformer = new OpenAIScenePerformer();
