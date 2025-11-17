import { profileIndexer, eventIndexer } from '../adapters';
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

const DAYS_TO_SEARCH_LATEST_MEMORIES = 7;

export class MemoryAppImpl implements MemoryApp {
	constructor(
		private readonly profileIndexer: ProfileIndexer,
		private readonly eventIndexer: EventIndexer
	) {}

	async get(cmd: MemoryGetCmd): Promise<MemporyGetResult> {
		const charIds = [cmd.povId, ...cmd.npcIds];

		const staticMemories = await this.getStaticMemories(cmd.chatId, cmd.tokens, charIds);
		const chatMemories = await this.getChatMemories(cmd.query, cmd.chatId, cmd.tokens);
		const charactersMemories = await this.getCharactersMemories(
			cmd.query,
			cmd.povId,
			cmd.npcIds,
			cmd.tokens
		);

		return {
			static: staticMemories,
			event: chatMemories,
			profile: charactersMemories
		};
	}

	async put(cmd: MemoryPutCmd): Promise<void> {
		const profileMemories: ProfileMemory[] = [];
		const eventMemories: EventMemory[] = [];
		for (const memory of cmd.memories) {
			if (memory.kind === 'profile') {
				profileMemories.push(memory);
			} else if (memory.kind === 'event') {
				eventMemories.push(memory);
			}
		}
		await Promise.all([
			this.profileIndexer.add(profileMemories),
			this.eventIndexer.add(eventMemories)
		]);
	}

	private async getStaticMemories(
		chatId: string,
		tokens: number,
		characterIds: string[]
	): Promise<StaticMemory[]> {
		// get story OR real world context
		// get static characters
		console.log(chatId, tokens, characterIds);
		const memories: StaticMemory[] = [];

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
		povId: string,
		npcIds: string[],
		tokens: number
	): Promise<ProfileMemory[]> {
		// get static characters
		console.log(query, povId, npcIds, tokens);
		const memories: ProfileMemory[] = [];
		return memories;
	}
}

Promise.all([profileIndexer.migrate(), eventIndexer.migrate()]).then(() => {
	console.log('Memory indexers migrated');
});
export const memoryApp = new MemoryAppImpl(profileIndexer, eventIndexer);
