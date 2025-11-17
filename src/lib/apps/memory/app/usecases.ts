import { profileIndexer, eventIndexer } from '../adapters';
import type {
	MemoryGetCmd,
	MemoryApp,
	Memory,
	ProfileIndexer,
	EventIndexer,
	ProfileMemory,
	EventMemory
} from '../core';

export class MemoryAppImpl implements MemoryApp {
	constructor(
		private readonly profileIndexer: ProfileIndexer,
		private readonly eventIndexer: EventIndexer
	) {}

	async get(cmd: MemoryGetCmd): Promise<Memory[]> {
		const memories: Memory[] = [];
		console.log(cmd);
		// const userMemories = await this.profileIndexer.search(
		// 	cmd.query,
		// 	cmd.limit,
		// 	cmd.type,
		// 	cmd.userId,
		// 	cmd.characterId
		// );
		// const characterMemories = await this.profileIndexer.search(
		// 	cmd.query,
		// 	cmd.limit,
		// 	cmd.type,
		// 	cmd.characterId
		// );
		return memories;
	}

	async put(memories: Memory[]): Promise<void> {
		const profileMemories: ProfileMemory[] = [];
		const eventMemories: EventMemory[] = [];
		for (const memory of memories) {
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
}

Promise.all([profileIndexer.migrate(), eventIndexer.migrate()]).then(() => {
	console.log('Memory indexers migrated');
});
export const memoryApp = new MemoryAppImpl(profileIndexer, eventIndexer);
