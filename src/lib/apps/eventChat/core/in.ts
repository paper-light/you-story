import type { UsersResponse } from '$lib';

export interface SendUserMessageCmd {
	user: UsersResponse;
	storyId: string;
	eventId: string;
	chatId: string;
	query: string;
}

export interface EventChatApp {
	sendUserMessage(cmd: SendUserMessageCmd): Promise<ReadableStream>;
}
