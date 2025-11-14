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
import type { SchemaScenePlan } from '../core/models';
import type z from 'zod';

class EventChatAppImpl implements EventChatApp {
	constructor(
		private readonly storyApp: StoryApp,
		private readonly storyEventApp: StoryEventApp,
		private readonly storyteller: Storyteller
	) {}

	async sendUserMessage(cmd: SendUserMessageCmd): Promise<ReadableStream> {
		const story = await this.storyApp.getStory(cmd.storyId);
		const storyEvent = await this.storyEventApp.get(cmd.eventId);

		story.buildPrompt(storyEvent.data.order);

		const chatRes: EventChatsResponse<Notes, EventChatExpand> = await pb
			.collection(Collections.EventChats)
			.getOne(cmd.chatId, {
				expand: 'messages_via_chat,povCharacter,storyEvent'
			});
		const chat = EventChat.fromResponse(chatRes);

		const userMsg = await pb.collection(Collections.Messages).create({
			chat: cmd.chatId,
			content: cmd.query,
			role: MessagesRoleOptions.user,
			status: MessagesStatusOptions.final,
			character: chat.data.povCharacter
		});

		const planScene = await this.storyteller.planScene(story, storyEvent, chat, userMsg);
		return this.createSSEStream(story, storyEvent, chat, userMsg, planScene);
	}

	private createSSEStream(
		story: Story,
		storyEvent: StoryEvent,
		chat: EventChat,
		userMsg: MessagesResponse,
		plan: z.infer<typeof SchemaScenePlan>
	): ReadableStream {
		const encoder = new TextEncoder();
		const storyteller = this.storyteller;

		return new ReadableStream({
			async start(controller) {
				const sendEvent = (event: string, data: string) => {
					controller.enqueue(encoder.encode(`event: ${event}\n`));
					controller.enqueue(encoder.encode(`data: ${data}\n\n`));
				};

				try {
					const processedSteps: z.infer<typeof SchemaScenePlan>['steps'] = [];

					for (let i = 0; i < plan.steps.length; i++) {
						const chatRes: EventChatsResponse<Notes, EventChatExpand> = await pb
							.collection(Collections.EventChats)
							.getOne(chat.data.id, {
								expand: 'messages_via_chat,povCharacter,storyEvent'
							});
						const newChat = EventChat.fromResponse(chatRes);

						const step = plan.steps[i];

						// Create a new message for this step
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

						// Send step start event
						sendEvent(
							'step_start',
							JSON.stringify({
								stepIndex: i,
								msgId: aiMsg.id,
								step: step
							})
						);

						// Create plan with current step and all previous processed steps
						const prevSteps: z.infer<typeof SchemaScenePlan> = {
							steps: [...processedSteps, step]
						};

						// Generate content for this step using previous steps
						const stepStream = storyteller.generateSceneStep(
							story,
							storyEvent,
							newChat,
							prevSteps,
							userMsg,
							aiMsg
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

							// Update message with final content
							await pb.collection(Collections.Messages).update(aiMsg.id, {
								status: MessagesStatusOptions.final,
								content: accumulatedText
							});

							// Add current step to processed steps for next iteration
							processedSteps.push(step);

							// Send step complete event
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
								content: accumulatedText || 'Error occurred during generation'
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

					// All steps completed
					sendEvent('done', JSON.stringify({ totalSteps: plan.steps.length }));
				} catch (error) {
					sendEvent('error', JSON.stringify({ error: String(error) }));
				} finally {
					controller.close();
				}
			}
		});
	}
}

export const eventChatApp = new EventChatAppImpl(storyApp, storyEventApp, storyteller);
