import type z from 'zod';

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
	type ScenePlanner,
	type ScenePerformer,
	type OpenAIMessage
} from '../core';
import { scenePlanner, scenePerformer } from '../adapters';
import type { SchemaScenePlan } from '../core/models';

class EventChatAppImpl implements EventChatApp {
	constructor(
		private readonly storyApp: StoryApp,
		private readonly storyEventApp: StoryEventApp,
		private readonly scenePlanner: ScenePlanner,
		private readonly scenePerformer: ScenePerformer
	) {}

	async sendUserMessage(cmd: SendUserMessageCmd): Promise<ReadableStream> {
		const story = await this.storyApp.getStory(cmd.storyId);
		const storyEvent = await this.storyEventApp.get(cmd.eventId);

		story.buildPrompt(storyEvent.data.order);

		const chat = await this.getChat(cmd.chatId);

		const preMessages = this.buildPreMessages(story, storyEvent, chat.data.povCharacter);

		const userMsg = await pb.collection(Collections.Messages).create({
			chat: cmd.chatId,
			content: cmd.query,
			role: MessagesRoleOptions.user,
			status: MessagesStatusOptions.final,
			character: chat.data.povCharacter
		});

		const aiMsg = await pb.collection(Collections.Messages).create({
			chat: chat.data.id,
			content: '',
			role: MessagesRoleOptions.ai,
			status: MessagesStatusOptions.streaming
		});
		const planScene = await this.scenePlanner.plan(
			chat,
			userMsg,
			preMessages,
			chat.data.id,
			cmd.user.id
		);
		await pb.collection(Collections.Messages).delete(aiMsg.id);

		return this.createSSEStream(chat, userMsg, planScene, preMessages);
	}

	private createSSEStream(
		chat: EventChat,
		userMsg: MessagesResponse,
		plan: z.infer<typeof SchemaScenePlan>,
		preMessages: OpenAIMessage[]
	): ReadableStream {
		const encoder = new TextEncoder();
		const scenePerformer = this.scenePerformer;
		const getChat = this.getChat;

		return new ReadableStream({
			async start(controller) {
				const sendEvent = (event: string, data: string) => {
					controller.enqueue(encoder.encode(`event: ${event}\n`));
					controller.enqueue(encoder.encode(`data: ${data}\n\n`));
				};

				try {
					const processedSteps: z.infer<typeof SchemaScenePlan>['steps'] = [];

					for (let i = 0; i < plan.steps.length; i++) {
						const newChat = await getChat(chat.data.id);

						const step = plan.steps[i];

						const aiMsg = await pb.collection(Collections.Messages).create({
							chat: chat.data.id,
							content: '',
							role: MessagesRoleOptions.ai,
							status: MessagesStatusOptions.streaming,
							character: step.characterId,
							metadata: {
								step
							}
						});

						sendEvent(
							'step_start',
							JSON.stringify({
								stepIndex: i,
								msgId: aiMsg.id,
								step: step
							})
						);

						const prevSteps: z.infer<typeof SchemaScenePlan> = {
							steps: [...processedSteps, step]
						};

						const stepStream = scenePerformer.perform(
							newChat,
							prevSteps,
							userMsg,
							aiMsg,
							preMessages
						);

						let accumulatedText = '';
						const reader = stepStream.getReader();

						try {
							while (true) {
								const { done, value } = await reader.read();
								if (done) break;

								accumulatedText += value.text;
								sendEvent(
									'chunk',
									JSON.stringify({
										text: value.text,
										msgId: aiMsg.id,
										stepIndex: i
									})
								);
							}

							await pb.collection(Collections.Messages).update(aiMsg.id, {
								status: MessagesStatusOptions.final,
								content: accumulatedText
							});

							processedSteps.push(step);

							sendEvent(
								'step_done',
								JSON.stringify({
									stepIndex: i,
									msgId: aiMsg.id
								})
							);
						} catch (error) {
							await pb.collection(Collections.Messages).update(aiMsg.id, {
								status: MessagesStatusOptions.final,
								content: accumulatedText || 'Error occurred during generation',
								metadata: {
									error: String(error)
								}
							});
							sendEvent(
								'step_error',
								JSON.stringify({
									stepIndex: i,
									msgId: aiMsg.id,
									error: String(error)
								})
							);
							throw error;
						} finally {
							reader.releaseLock();
						}
					}

					sendEvent('done', JSON.stringify({ totalSteps: plan.steps.length }));
				} catch (error) {
					sendEvent('error', JSON.stringify({ error: String(error) }));
				} finally {
					controller.close();
				}
			}
		});
	}

	private buildPreMessages(
		story: Story,
		event: StoryEvent,
		povCharacterId: string
	): OpenAIMessage[] {
		const messages: OpenAIMessage[] = [];

		messages.push({ role: 'system', content: story.prompt });
		messages.push({ role: 'system', content: event.prompt });

		const chars = event.getCharacters().filter((char) => char.id !== povCharacterId);
		if (chars.length > 0) {
			messages.push({
				role: 'system',
				content:
					'Available characters:\n' +
					chars.map((char) => `- ${char.name} ${char.age} (${char.id})`).join('\n')
			});
			messages.push({
				role: 'system',
				content: `NEVER mention the POV character by name in your responses. The POV character is ${povCharacterId}.`
			});
		}

		return messages;
	}

	private async getChat(chatId: string): Promise<EventChat> {
		const chatRes: EventChatsResponse<Notes, EventChatExpand> = await pb
			.collection(Collections.EventChats)
			.getOne(chatId, {
				expand: 'messages_via_chat,messages_via_chat.character,povCharacter,storyEvent'
			});
		const chat = EventChat.fromResponse(chatRes);
		return chat;
	}
}

export const eventChatApp = new EventChatAppImpl(
	storyApp,
	storyEventApp,
	scenePlanner,
	scenePerformer
);
