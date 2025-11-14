import type { Story } from '$lib/apps/story/core';
import type { StoryEvent } from '$lib/apps/storyEvent/core';
import type { MessagesResponse } from '$lib/shared';
import type z from 'zod';

import type { EventChat, MessageChunk, SchemaScenePlan } from './models';

export interface Storyteller {
	planScene(
		story: Story,
		storyEvent: StoryEvent,
		chat: EventChat,
		userMsg: MessagesResponse
	): Promise<z.infer<typeof SchemaScenePlan>>;

	generateSceneStep(
		story: Story,
		storyEvent: StoryEvent,
		chat: EventChat,
		prevSteps: z.infer<typeof SchemaScenePlan>,
		userMsg: MessagesResponse,
		aiMsg: MessagesResponse
	): ReadableStream<MessageChunk>;
}
