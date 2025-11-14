import { Collections, pb, type Create, type Update } from '$lib';

import type { MessageChunk } from '$lib/apps/eventChat/core';

import { messagesStore } from './messages.svelte.ts';

class EventChatsApi {
	// Create new chat
	async create(dto: Create<Collections.EventChats>) {
		const chat = await pb.collection(Collections.EventChats).create(dto);
		return chat;
	}

	// Update chat
	async update(id: string, dto: Update<Collections.EventChats>) {
		const chat = await pb.collection(Collections.EventChats).update(id, dto);
		return chat;
	}

	async sendMessage(storyId: string, eventId: string, dto: Create<Collections.Messages>) {
		if (!dto.content) throw new Error('Content is required');

		messagesStore.addOptimisticMessage(dto);

		const es = new EventSource(
			`/api/stories/${storyId}/events/${eventId}/chats/${dto.chat}/sse?q=${encodeURIComponent(dto.content)}`,
			{
				withCredentials: true
			}
		);

		es.addEventListener('chunk', (e) => {
			const chunk = JSON.parse(e.data) as MessageChunk;
			messagesStore.addChunk(chunk);
		});
		es.addEventListener('error', (e) => {
			console.error(e);
			es.close();
		});
		es.addEventListener('done', () => {
			es.close();
		});
	}
}

export const eventChatsApi = new EventChatsApi();
