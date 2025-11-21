import {
	Collections,
	MessagesRoleOptions,
	MessagesStatusOptions,
	pb,
	type ChatExpand,
	type ChatsResponse
} from '$lib';
import {
	StepMode,
	type EnhanceOutput,
	type OpenAIMessage,
	type SceneApp,
	type ScenePlan
} from '$lib/apps/scene/core';

import { LLMS, TOKENIZERS } from '$lib/shared/server';

import type { MemoryApp, MemporyGetResult } from '$lib/apps/memory/core';

import { type ChatApp, type Notes, type SendUserMessageCmd, Chat } from '../core';

const HISTORY_TOKEN_LIMIT = 2000;
const MEMORY_TOKEN_LIMIT = 5000;

export class ChatAppImpl implements ChatApp {
	constructor(
		private readonly memoryApp: MemoryApp,
		private readonly sceneApp: SceneApp
	) {}

	async run(cmd: SendUserMessageCmd): Promise<string> {
		const { kind, chat, scenePlan, memRes, history, enhance } = await this.prepare(cmd);
		const finalText = await this.runSteps(
			chat,
			kind as 'friend' | 'story',
			scenePlan,
			memRes,
			history,
			enhance
		);
		return finalText;
	}

	async generate(cmd: SendUserMessageCmd): Promise<ReadableStream> {
		const { kind, chat, scenePlan, memRes, history, enhance } = await this.prepare(cmd);
		return this.createSSEStream(
			kind as 'friend' | 'story',
			chat,
			scenePlan,
			memRes,
			history,
			enhance
		);
	}

	private createSSEStream(
		kind: 'friend' | 'story',
		chat: Chat,
		plan: ScenePlan,
		memRes: MemporyGetResult,
		history: OpenAIMessage[],
		enhance: EnhanceOutput
	): ReadableStream {
		const encoder = new TextEncoder();
		const runSteps = this.runSteps;

		return new ReadableStream({
			async start(controller) {
				const sendEvent = (event: string, data: string) => {
					controller.enqueue(encoder.encode(`event: ${event}\n`));
					controller.enqueue(encoder.encode(`data: ${data}\n\n`));
				};

				try {
					await runSteps(chat, kind, plan, memRes, history, enhance, sendEvent);
					sendEvent('done', JSON.stringify({ totalSteps: plan.steps.length }));
				} catch (error) {
					sendEvent('error', JSON.stringify({ error: String(error) }));
				} finally {
					controller.close();
				}
			}
		});
	}

	private async runSteps(
		chat: Chat,
		kind: 'friend' | 'story',
		plan: ScenePlan,
		memRes: MemporyGetResult,
		history: OpenAIMessage[],
		enhance: EnhanceOutput,
		sendEvent?: (event: string, data: string) => void
	) {
		let finalText = '';

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

			if (sendEvent) {
				// STREAM
				const stepStream = this.sceneApp.actStream(kind, plan, i, memRes, history);
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
					finalText += accumulatedText;

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
			} else {
				// NON-STREAM
				const answer = await this.sceneApp.act(kind, plan, i, memRes, history);
				await pb.collection(Collections.Messages).update(aiMsg.id, {
					status: MessagesStatusOptions.final,
					content: answer
				});
				history.push({
					role: 'assistant',
					content: answer
				});
				finalText += answer;
			}
		}

		const profiles = enhance.profileMemorySuggestions.map((suggestion) => ({
			type: suggestion.type,
			content: suggestion.content,
			characterIds: suggestion.characterIds,
			importance: suggestion.importance
		}));
		const events = enhance.eventMemorySuggestions.map((suggestion) => ({
			type: suggestion.type,
			content: suggestion.content,
			chatId: chat.data.id,
			importance: suggestion.importance
		}));

		if (profiles.length > 0 || events.length > 0) {
			try {
				await this.memoryApp.put({
					profiles: profiles,
					events: events
				});
			} catch (error) {
				console.error('Failed to index memories:', error);
			}
		}

		return finalText;
	}

	private async prepare(cmd: SendUserMessageCmd) {
		const chat = await this.getChat(cmd.chatId);
		const kind = chat.data.storyEvent ? 'story' : 'friend';

		const { userMsg, aiMsg } = await this.persistMessages(cmd, chat);

		// Load contexts
		const history = this.trimMessages(chat, HISTORY_TOKEN_LIMIT);
		history.push({
			role: 'user',
			content: cmd.query
		});

		const npcIds = this.getNpcIds(chat);

		const memRes = await this.memoryApp.get({
			query: this.getMemoryQuery(history),
			tokens: MEMORY_TOKEN_LIMIT,
			povId: chat.data.povCharacter,
			npcIds: npcIds,
			chatId: chat.data.id
		});

		const enhance = await this.sceneApp.enhanceQuery(history, memRes);
		const policy = await this.sceneApp.getPolicy(enhance);

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

		return { kind, chat, scenePlan, memRes, history, enhance };
	}

	private getMemoryQuery(history: OpenAIMessage[]): string {
		const trimmed = history.at(-1)!.content.trim();
		if (trimmed.length < 4 || ['yes', 'no', 'ok', 'yeah', 'yep', 'alright'].includes(trimmed)) {
			const lastSubstantiveUserMessage = history.findLast(
				(msg) => msg.role === 'user' && msg.content.length > 4
			);
			return lastSubstantiveUserMessage?.content ?? trimmed;
		}
		return trimmed;
	}

	private getNpcIds(chat: Chat): string[] {
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
		return npcIds;
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
				expand: 'messages_via_chat,messages_via_chat.character,povCharacter,storyEvent',
				sort: '-messages_via_chat.created'
			});
		const chat = Chat.fromResponse(chatRes);
		return chat;
	}

	private trimMessages(chat: Chat, tokens: number): OpenAIMessage[] {
		const allMessages = chat.getMessages().filter((msg) => msg.content);
		const reversedMessages = [...allMessages].reverse();

		const messages: OpenAIMessage[] = [];
		let totalTokens = 0;

		for (const msg of reversedMessages) {
			const msgTokens = TOKENIZERS[LLMS.GROK_4_FAST].encode(msg.content).length;
			if (totalTokens + msgTokens > tokens) break;

			totalTokens += msgTokens;
			messages.push({
				role: msg.role === MessagesRoleOptions.user ? 'user' : 'assistant',
				content: msg.content
			});
		}

		messages.reverse();
		return messages;
	}
}
