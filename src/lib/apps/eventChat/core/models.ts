export type Sender = {
	id: string;
	avatar: string;
	name: string;
	role: string;
};

export type MessageChunk = {
	text: string;
	msgId: string;
	i?: number;
};
