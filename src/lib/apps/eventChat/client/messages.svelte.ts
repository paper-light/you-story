import { Collections, pb, type Create, type MessagesResponse } from '$lib';
import type { MessageChunk } from '$lib/apps/eventChat/core';

class MessagesStore {
	_messages: MessagesResponse[] = $state([]);

	get messages() {
		return this._messages;
	}
	set messages(messages: MessagesResponse[]) {
		this._messages = messages;
	}

	getById(id: string) {
		return this._messages.find((m) => m.id === id);
	}

	addChunk(chunk: MessageChunk) {
		const msg = this.getById(chunk.msgId);
		if (!msg || msg.status !== 'streaming') return;

		// const nextI = chunk.i ?? ((msg as any)._last_i ?? 0) + 1;
		// if ((msg as any)._last_i && nextI <= (msg as any)._last_i) return;
		// (msg as any)._last_i = nextI;

		const newMsg = { ...msg, content: msg.content + chunk.text };
		this._messages = this._messages.map((m) => (m.id === msg.id ? newMsg : m));
	}

	async load(chatId: string) {
		const messages = await pb.collection(Collections.Messages).getFullList({
			filter: `chat = "${chatId}"`,
			sort: 'created'
		});
		this.messages = messages;
	}

	addOptimisticMessage(dto: Create<Collections.Messages>) {
		const message = {
			id: `temp-${Date.now()}`,
			...dto,
			status: 'optimistic' as MessagesResponse['status']
		} as MessagesResponse;
		this._messages.push(message);
	}

	subscribe(eventChatId: string) {
		return pb.collection(Collections.Messages).subscribe(
			'*',
			(e) => {
				const message = e.record;
				switch (e.action) {
					case 'create': {
						this._messages = this._messages.filter((m) => !m.id.startsWith('temp-'));
						this.messages.push(message);
						break;
					}
					case 'update': {
						this.messages = this.messages?.map((m) => (m.id === message.id ? message : m)) || [];
						break;
					}
					case 'delete': {
						this.messages = this.messages?.filter((m) => m.id !== message.id) || [];
						break;
					}
				}
			},
			{
				filter: `chat = "${eventChatId}"`
			}
		);
	}

	unsubscribe() {
		pb.collection(Collections.Messages).unsubscribe();
	}
}

export const messagesStore = new MessagesStore();
