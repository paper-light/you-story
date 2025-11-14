import z from 'zod';
import type { EventChatExpand, EventChatsResponse } from '$lib';

export type Sender = {
	id: string;
	avatar: string;
	name: string;
	role: string;
};

export type MessageChunk = {
	text: string;
	msgId: string;
	i?: number;
};

export const SchemaSceneStep = z.object({
	type: z.enum(['world', 'character']),
	characterId: z.string().optional().nullable(),
	description: z.string()
});
export const SchemaScenePlan = z.object({
	steps: z.array(SchemaSceneStep)
});

export type Notes = string[];

export class EventChat {
	constructor(public readonly data: EventChatsResponse<Notes, EventChatExpand>) {}

	static fromResponse(res: EventChatsResponse<Notes, EventChatExpand>): EventChat {
		return new EventChat(res);
	}

	getMessages() {
		return this.data.expand?.messages_via_chat || [];
	}
}
