import { Index, MeiliSearch, type UserProvidedEmbedder } from 'meilisearch';
import { MEILI_URL, MEILI_MASTER_KEY } from '$env/static/private';

import { nanoid } from '$lib/shared';

import type { EventMemory, EventIndexer, EventType } from '../../core';

type EventDoc = {
	id: string;
	type: EventType;
	chatId: string;
	content: string;
	createdAt: string;
};

export const EVENT_EMBEDDERS = {
	voyage: {
		source: 'userProvided',
		dimensions: 1024
	} as UserProvidedEmbedder
};

export class MeiliEventIndexer implements EventIndexer {
	private readonly client: MeiliSearch;
	private readonly index: Index<EventDoc>;

	constructor() {
		this.client = new MeiliSearch({
			host: MEILI_URL,
			apiKey: MEILI_MASTER_KEY
		});
		this.index = this.client.index('profiles');
	}

	async migrate(): Promise<void> {
		await this.index.updateEmbedders(EVENT_EMBEDDERS);
		await this.index.updateFilterableAttributes(['type', 'chatId', 'createdAt']);
	}

	async add(memories: EventMemory[]): Promise<void> {
		const docs: EventDoc[] = [];
		for (const memory of memories) {
			const id = `${memory.type}:${memory.chatId}:${nanoid()}`;
			const doc: EventDoc = {
				id,
				type: memory.type,
				chatId: memory.chatId,
				content: memory.content,
				createdAt: new Date().toISOString()
			};
			docs.push(doc);
		}

		await this.index.addDocuments(docs);
	}

	async search(
		query: string,
		limit: number,
		type?: EventType,
		chatId?: string,
		days?: number
	): Promise<EventMemory[]> {
		let f = ``;
		if (type) f += `type = "${type}"`;
		if (chatId) f += `${f ? ' AND ' : ''}chatId = "${chatId}"`;
		if (days) {
			const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
			f += `${f ? ' AND ' : ''}createdAt >= "${start.toISOString()}"`;
		}

		const res = await this.index.search(query, {
			filter: f,
			limit,
			hybrid: {
				embedder: 'voyage',
				semanticRatio: 0.5
			}
		});
		const memories: EventMemory[] = res.hits.map((hit) => ({
			kind: 'event',
			type: hit.type,
			chatId: hit.chatId,
			content: hit.content,
			createdAt: hit.createdAt
		}));
		return memories;
	}
}

export const eventIndexer = new MeiliEventIndexer();
