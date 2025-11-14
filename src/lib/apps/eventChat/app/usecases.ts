import {
	Collections,
	MessagesRoleOptions,
	MessagesStatusOptions,
	pb,
	type EventChatExpand,
	type EventChatsResponse,
	type MessagesResponse
} from '$lib';

import { storyApp } from '$lib/apps/story/app';
import { storyEventApp } from '$lib/apps/storyEvent/app';

import type { Story, StoryApp } from '$lib/apps/story/core';
import type { StoryEvent, StoryEventApp } from '$lib/apps/storyEvent/core';

import {
	type EventChatApp,
	type Notes,
	type SendUserMessageCmd,
	EventChat,
	type Storyteller
} from '../core';
import { storyteller } from '../adapters/storyteller';

class EventChatAppImpl implements EventChatApp {
	constructor(
		private readonly storyApp: StoryApp,
		private readonly storyEventApp: StoryEventApp,
		private readonly storyteller: Storyteller
	) {}

	async sendUserMessage(cmd: SendUserMessageCmd): Promise<ReadableStream> {
		const story = await this.storyApp.getStory(cmd.storyId);
		const storyEvent = await this.storyEventApp.get(cmd.eventId);

		const chatRes: EventChatsResponse<Notes, EventChatExpand> = await pb
			.collection(Collections.EventChats)
			.getOne(cmd.chatId, {
				expand: 'messages_via_chat,povCharacter,storyEvent'
			});
		const chat = EventChat.fromResponse(chatRes);

		await pb.collection(Collections.Messages).create({
			chat: cmd.chatId,
			content: cmd.query,
			role: MessagesRoleOptions.user,
			status: MessagesStatusOptions.final,
			character: chat.data.povCharacter
		});

		const aiMsg = await pb.collection(Collections.Messages).create({
			chat: cmd.chatId,
			content: '',
			role: MessagesRoleOptions.ai,
			status: MessagesStatusOptions.streaming
		});

		return this.createSSEStream(story, storyEvent, chat, aiMsg);
	}

	private createSSEStream(
		story: Story,
		storyEvent: StoryEvent,
		chat: EventChat,
		aiMsg: MessagesResponse
	): ReadableStream {
		const storytellerStream = this.storyteller.streamStory(story, storyEvent, chat);
		const encoder = new TextEncoder();

		return new ReadableStream({
			async start(controller) {
				const sendEvent = (event: string, data: string) => {
					controller.enqueue(encoder.encode(`event: ${event}\n`));
					controller.enqueue(encoder.encode(`data: ${data}\n\n`));
				};

				let accumulatedText = '';
				const reader = storytellerStream.getReader();

				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;

						accumulatedText += value.text;
						sendEvent(
							'chunk',
							JSON.stringify({
								text: value.text,
								msgId: aiMsg.id
							})
						);
					}

					await pb.collection(Collections.Messages).update(aiMsg.id, {
						status: MessagesStatusOptions.final,
						content: accumulatedText
					});
					sendEvent('done', aiMsg.id);
				} catch (error) {
					await pb.collection(Collections.Messages).update(aiMsg.id, {
						status: MessagesStatusOptions.final,
						content: accumulatedText || 'Error occurred during generation'
					});
					sendEvent('error', JSON.stringify({ error: String(error) }));
				} finally {
					reader.releaseLock();
					controller.close();
				}
			}
		});
	}
}

export const eventChatApp = new EventChatAppImpl(storyApp, storyEventApp, storyteller);
