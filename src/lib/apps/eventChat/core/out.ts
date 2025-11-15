import type z from 'zod';
import type { MessagesResponse } from '$lib/shared';

import type { EventChat, MessageChunk, SchemaScenePlan } from './models';

export type OpenAIMessage = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

export interface ScenePlanner {
	plan(
		chat: EventChat,
		userMsg: MessagesResponse,
		preMessages: OpenAIMessage[],
		sessionId: string,
		userId: string
	): Promise<z.infer<typeof SchemaScenePlan>>;
}

export interface ScenePerformer {
	perform(
		chat: EventChat,
		prevSteps: z.infer<typeof SchemaScenePlan>,
		userMsg: MessagesResponse,
		aiMsg: MessagesResponse,
		preMessages: OpenAIMessage[]
	): ReadableStream<MessageChunk>;
}
