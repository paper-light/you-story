import type { EventMemory, EventType, ProfileMemory, ProfileType, Relationship } from './models';

export interface ProfileIndexer {
	add(memory: ProfileMemory[]): Promise<void>;
	search(
		query: string,
		limit: number,
		type?: ProfileType,
		userId?: string,
		characterId?: string,
		relationships?: Relationship[]
	): Promise<ProfileMemory[]>;
}
export interface EventIndexer {
	add(memory: EventMemory[]): Promise<void>;
	search(
		query: string,
		limit: number,
		type?: EventType,
		chatId?: string,
		days?: number
	): Promise<EventMemory[]>;
}
