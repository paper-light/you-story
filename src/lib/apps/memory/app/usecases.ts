import type { StoryApp } from '$lib/apps/story/core';
import type { CharacterApp } from '$lib/apps/character/core';
import type {
	MemoryGetCmd,
	MemoryApp,
	ProfileIndexer,
	EventIndexer,
	ProfileMemory,
	EventMemory,
	MemoryPutCmd,
	StaticMemory,
	MemporyGetResult
} from '../core';
import { LLMS, TOKENIZERS } from '$lib/shared/server';

const DAYS_TO_SEARCH_LATEST_MEMORIES = 7;
const STATIC_TOKEN_LIMIT = 2000;

export class MemoryAppImpl implements MemoryApp {
	constructor(
		// ADAPTERS
		private readonly profileIndexer: ProfileIndexer,
		private readonly eventIndexer: EventIndexer,

		// APPS
		private readonly storyApp: StoryApp,
		private readonly characterApp: CharacterApp
	) {}

	async get(cmd: MemoryGetCmd): Promise<MemporyGetResult> {
		console.log('Getting memories for chat: ', cmd.chatId);
		const charIds = [cmd.povId, ...cmd.npcIds].filter((id) => id.trim() !== '');

		// STATIC
		const staticMemories = await this.getStaticMemories(cmd.chatId, STATIC_TOKEN_LIMIT, charIds);
		cmd.tokens -= staticMemories.reduce((acc, mem) => acc + mem.tokens, 0);

		// CHARACTERS
		const charactersMemories = await this.getCharactersMemories(
			cmd.query,
			charIds,
			Math.floor(cmd.tokens / 2)
		);
		cmd.tokens -= charactersMemories.reduce((acc, mem) => acc + mem.tokens, 0);

		// CHAT
		const chatMemories = await this.getChatMemories(cmd.query, cmd.chatId, cmd.tokens);
		return {
			static: staticMemories,
			event: chatMemories,
			profile: charactersMemories
		};
	}

	async put(cmd: MemoryPutCmd): Promise<void> {
		const profileMemories: ProfileMemory[] = [];
		const eventMemories: EventMemory[] = [];

		for (const profile of cmd.profiles) {
			if (profile.characterIds.length === 0 || profile.characterIds.length > 2) {
				console.warn('Character IDs are not valid', profile);
				continue;
			}
			const tokens = TOKENIZERS[LLMS.GROK_4_FAST].encode(profile.content).length;
			profileMemories.push({
				kind: 'profile',
				type: profile.type,
				characterIds: profile.characterIds,
				content: profile.content,
				importance: profile.importance,
				tokens
			});
		}

		for (const event of cmd.events) {
			if (event.chatId.trim() === '') {
				console.warn('Chat ID is not valid', event);
				continue;
			}
			const tokens = TOKENIZERS[LLMS.GROK_4_FAST].encode(event.content).length;
			eventMemories.push({
				kind: 'event',
				type: event.type,
				chatId: event.chatId,
				content: event.content,
				importance: event.importance,
				tokens
			});
		}

		console.log(
			`Prepared ${profileMemories.length} profile memories and ${eventMemories.length} event memories for indexing`
		);

		try {
			await Promise.all([
				this.profileIndexer.add(profileMemories),
				this.eventIndexer.add(eventMemories)
			]);
			console.log('Successfully completed memory indexing');
		} catch (error) {
			console.error('Error in memory.put:', error);
			throw error;
		}
	}

	private async getStaticMemories(
		chatId: string,
		tokens: number,
		characterIds: string[]
	): Promise<StaticMemory[]> {
		const memories: StaticMemory[] = [];
		let storyPrompt = '';
		try {
			const story = await this.storyApp.getByChat(chatId);
			storyPrompt += story.staticPrompt;
		} catch {
			storyPrompt = `
General Information:
Today is ${new Date().toLocaleDateString()}.
`;
			console.warn(`Story not found for chat ${chatId}`);
		}
		memories.push({
			kind: 'static',
			content: storyPrompt,
			tokens: TOKENIZERS[LLMS.GROK_4_FAST].encode(storyPrompt).length
		});

		tokens -= memories[0].tokens;
		if (tokens < 0) {
			console.warn(
				`Not enough tokens for static prompt for chat ${chatId}: ${tokens * -1} tokens more`
			);
			return memories;
		}

		const characters = await this.characterApp.getByIds(characterIds);
		for (const char of characters) {
			const mem: StaticMemory = {
				kind: 'static',
				characterId: char.data.id,
				content: char.staticPrompt,
				tokens: TOKENIZERS[LLMS.GROK_4_FAST].encode(char.staticPrompt).length
			};
			memories.push(mem);
			if (mem.tokens > tokens) {
				console.warn(
					`Not enough tokens for character ${char.data.name}: ${mem.tokens * -1} tokens more`
				);
				break;
			}
			tokens -= mem.tokens;
		}

		return memories;
	}

	private async getChatMemories(
		query: string,
		chatId: string,
		tokens: number
	): Promise<EventMemory[]> {
		const half = Math.floor(tokens / 2);
		const allMemories = await this.eventIndexer.search(query, half, chatId);
		const latestMemories = await this.eventIndexer.search(
			query,
			half,
			chatId,
			DAYS_TO_SEARCH_LATEST_MEMORIES
		);
		return [...allMemories, ...latestMemories];
	}

	private async getCharactersMemories(
		query: string,
		charIds: string[],
		tokens: number
	): Promise<ProfileMemory[]> {
		const memories = await this.profileIndexer.search(query, tokens, charIds);
		return memories;
	}
}
