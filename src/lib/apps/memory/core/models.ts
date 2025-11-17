export type ProfileType = 'character' | 'relationship';

export type EventType = 'story' | 'chat' | 'action' | 'decision';

export type ProfileMemory = {
	kind: 'profile';
	type: ProfileType;
	characterIds: string[];
	content: string;
	tokens: number;
};

export type EventMemory = {
	kind: 'event';
	type: EventType;
	content: string;
	chatId: string;
	tokens: number;
};

export type StaticMemory = {
	kind: 'static';
	content: string;
	tokens: number;
};

export type Memory = ProfileMemory | EventMemory | StaticMemory;
