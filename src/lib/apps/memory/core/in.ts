import type { EventMemory, Memory, ProfileMemory, StaticMemory } from './models';

export type MemoryGetCmd = {
	query: string;
	tokens: number;
	povId: string;
	npcIds: string[];
	chatId: string;
};
export type MemporyGetResult = {
	static: StaticMemory[];
	event: EventMemory[];
	profile: ProfileMemory[];
};

export type MemoryPutCmd = {
	memories: Memory[];
};

export interface MemoryApp {
	get(cmd: MemoryGetCmd): Promise<MemporyGetResult>;
	put(cmd: MemoryPutCmd): Promise<void>;
}
