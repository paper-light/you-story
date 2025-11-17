export type ProfileType = 'character' | 'user' | 'relationship';

export type EventType = 'story' | 'chat' | 'action' | 'decision';

export type ProfileMemory = {
	kind: 'profile';
	type: ProfileType;
	userId?: string;
	characterId?: string;
	relationship?: Relationship;
	content: string;
};

export type EventMemory = {
	kind: 'event';
	type: EventType;
	content: string;
	chatId: string;
};

export type Memory = ProfileMemory | EventMemory;

export type Relationship = {
	userId?: string;
	characterIds?: string[];
};
