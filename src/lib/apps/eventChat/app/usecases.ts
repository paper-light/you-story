import {
	Collections,
	MessagesRoleOptions,
	MessagesStatusOptions,
	pb,
	type ChatExpand,
	type ChatsResponse
} from '$lib';
import { StepMode, type OpenAIMessage, type SceneApp, type ScenePlan } from '$lib/apps/scene/core';
import { sceneApp } from '$lib/apps/scene/app';
import { LLMS, TOKENIZERS } from '$lib/shared/server';
import { memoryApp } from '$lib/apps/memory/app';
import type { MemoryApp, MemporyGetResult } from '$lib/apps/memory/core';

import { type ChatApp, type Notes, type SendUserMessageCmd, Chat } from '../core';

const HISTORY_TOKEN_LIMIT = 2000;
const MEMORY_TOKEN_LIMIT = 5000;

class ChatAppImpl implements ChatApp {
	constructor(
		private readonly memoryApp: MemoryApp,
		private readonly sceneApp: SceneApp
	) {}

	async generate(cmd: SendUserMessageCmd): Promise<ReadableStream> {
		// Save start messages
		const chat = await this.getChat(cmd.chatId);
		const kind = chat.data.storyEvent ? 'story' : 'friend';

		const { userMsg, aiMsg } = await this.persistMessages(cmd, chat);

		// Load contexts
		const history = this.trimMessages(chat, HISTORY_TOKEN_LIMIT);
		history.push({
			role: 'user',
			content: cmd.query
		});

		const enhance = await this.sceneApp.enhanceQuery(history);
		const policy = await this.sceneApp.getPolicy(enhance);

		const npcIds = [];
		if (chat.data.friend) {
			npcIds.push(chat.data.friend);
		} else {
			npcIds.push(
				...(chat.data.expand?.storyEvent?.characters ?? []).filter(
					(id) => id !== chat.data.povCharacter
				)
			);
		}

		const memRes = await this.memoryApp.get({
			query: enhance.query,
			tokens: MEMORY_TOKEN_LIMIT,
			povId: chat.data.povCharacter,
			npcIds: npcIds,
			chatId: chat.data.id
		});

		const scenePlanRaw = await this.sceneApp.plan(policy, memRes, history);
		const scenePlan =
			kind === 'story'
				? scenePlanRaw
				: scenePlanRaw.steps
						.filter((step) => step.type === 'speech' || step.type === 'thoughts')
						.reduce(
							(acc, step) => {
								acc.steps[0].description += step.description;
								return acc;
							},
							{
								steps: [
									{
										type: StepMode.Speech,
										description: '',
										characterId: chat.data.friend
									}
								]
							}
						);

		await pb.collection(Collections.Messages).update(userMsg.id, {
			metadata: {
				scenePlan: scenePlan,
				scenePolicy: policy,
				enhance: enhance
			}
		});
		await pb.collection(Collections.Messages).delete(aiMsg.id);

		return this.createSSEStream(kind, chat, scenePlan, memRes, history);
	}

	private createSSEStream(
		kind: 'friend' | 'story',
		chat: Chat,
		plan: ScenePlan,
		memRes: MemporyGetResult,
		history: OpenAIMessage[]
	): ReadableStream {
		const encoder = new TextEncoder();
		const sceneApp = this.sceneApp;

		return new ReadableStream({
			async start(controller) {
				const sendEvent = (event: string, data: string) => {
					controller.enqueue(encoder.encode(`event: ${event}\n`));
					controller.enqueue(encoder.encode(`data: ${data}\n\n`));
				};

				try {
					for (let i = 0; i < plan.steps.length; i++) {
						const aiMsg = await pb.collection(Collections.Messages).create({
							chat: chat.data.id,
							content: '',
							role: MessagesRoleOptions.ai,
							status: MessagesStatusOptions.streaming,
							character: plan.steps[i].characterId,
							metadata: {
								step: plan.steps[i]
							}
						});
						const stepStream = sceneApp.actStream(kind, plan, i, memRes, history);

						let accumulatedText = '';
						const reader = stepStream.getReader();
						try {
							while (true) {
								const { done, value } = await reader.read();
								if (done) break;

								accumulatedText += value;
								sendEvent(
									'chunk',
									JSON.stringify({
										text: value,
										msgId: aiMsg.id,
										stepIndex: i
									})
								);
							}

							await pb.collection(Collections.Messages).update(aiMsg.id, {
								status: MessagesStatusOptions.final,
								content: accumulatedText
							});
							history.push({
								role: 'assistant',
								content: accumulatedText
							});
						} catch (error) {
							await pb.collection(Collections.Messages).update(aiMsg.id, {
								status: MessagesStatusOptions.final,
								content: accumulatedText || 'Error occurred during generation',
								metadata: {
									error: String(error)
								}
							});
							sendEvent(
								'error',
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

	private async persistMessages(cmd: SendUserMessageCmd, chat: Chat) {
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
		return { userMsg, aiMsg };
	}
	private async getChat(chatId: string): Promise<Chat> {
		const chatRes: ChatsResponse<Notes, ChatExpand> = await pb
			.collection(Collections.Chats)
			.getOne(chatId, {
				expand: 'messages_via_chat,messages_via_chat.character,povCharacter,storyEvent'
			});
		const chat = Chat.fromResponse(chatRes);
		return chat;
	}

	private trimMessages(chat: Chat, tokens: number): OpenAIMessage[] {
		const messages: OpenAIMessage[] = [];
		let totalTokens = 0;
		for (const msg of chat.getMessages()) {
			if (!msg.content) continue;
			totalTokens += TOKENIZERS[LLMS.GROK_4_FAST].encode(msg.content).length;
			if (totalTokens > tokens) break;
			messages.push({
				role: msg.role === MessagesRoleOptions.user ? 'user' : 'assistant',
				content: msg.content
			});
		}
		return messages;
	}
}

export const chatApp = new ChatAppImpl(memoryApp, sceneApp);
