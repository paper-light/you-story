import type { Memory, Relationship } from './models';

export type MemoryGetCmd = {
	query: string;
	tokenLimit: number;
	userId?: string;
	characterId?: string;
	relationships?: Relationship[];
};

export interface MemoryApp {
	get(cmd: MemoryGetCmd): Promise<Memory[]>;
	put(memory: Memory[]): Promise<void>;
}
