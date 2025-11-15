import z from 'zod';
import type { EventChatExpand, EventChatsResponse, MessageExpand, MessagesResponse } from '$lib';

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
	type: z.enum(['world', 'character-thoughts', 'character-speech']).describe(
		`
World: update the environment, atmosphere, or overall mood.
Character-thoughts: focus the scene on the character's thoughts.
Character-speech: focus the scene on the character's dialogue.
`
	),
	characterId: z.string().optional().nullable(),
	description: z.string()
});
export const SchemaScenePlan = z.object({
	steps: z.array(SchemaSceneStep)
});

export type MessageMetadata = {
	step?: z.infer<typeof SchemaSceneStep>;
};

export type Notes = string[];

export class EventChat {
	constructor(public readonly data: EventChatsResponse<Notes, EventChatExpand>) {}

	static fromResponse(res: EventChatsResponse<Notes, EventChatExpand>): EventChat {
		return new EventChat(res);
	}

	getMessages(): MessagesResponse<MessageMetadata, MessageExpand>[] {
		return (
			(this.data.expand?.messages_via_chat as MessagesResponse<MessageMetadata, MessageExpand>[]) ||
			[]
		);
	}
}
