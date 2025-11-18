import { Index, MeiliSearch, type UserProvidedEmbedder } from 'meilisearch';
import { MEILI_URL, MEILI_MASTER_KEY } from '$env/static/private';

import { nanoid } from '$lib/shared';

import type { EventMemory, EventIndexer, EventType } from '../../core';
import { EMBEDDERS, voyage } from '$lib/shared/server';

const BATCH_SIZE = 128;
const VOYAGE_EMBEDDER = 'voyage';
const SEARCH_RATIO = 0.75;
const CHUNK_TOKEN_LIMIT = 256;

type EventDoc = {
	id: string;
	type: EventType;
	content: string;
	chatId: string;
	createdAt: string;
	tokens: number;
	_vectors: Record<string, Record<string, number[]>>;
};

export const EVENT_EMBEDDERS = {
	[VOYAGE_EMBEDDER]: {
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
		this.index = this.client.index('events');
	}

	async migrate(): Promise<void> {
		await this.index.updateEmbedders(EVENT_EMBEDDERS);
		await this.index.updateFilterableAttributes(['type', 'chatId', 'createdAt']);
	}

	async add(memories: EventMemory[]): Promise<void> {
		const docs: EventDoc[] = [];
		const validMemories = memories.filter((memory) => {
			if (memory.tokens > CHUNK_TOKEN_LIMIT) {
				console.warn('Event memory tokens are too high', memory);
				return false;
			}
			return true;
		});

		const embedTasks = [];
		for (let i = 0; i < validMemories.length; i += BATCH_SIZE) {
			const batch = validMemories.slice(i, i + BATCH_SIZE).map((memory) => memory.content);
			embedTasks.push(
				voyage.embed({
					input: batch,
					model: EMBEDDERS.VOYAGE_LITE
				})
			);
		}
		const embeddings = (await Promise.all(embedTasks))
			.flatMap((res) => res.data)
			.map((res) => res?.embedding);

		for (let i = 0; i < validMemories.length; i++) {
			const memory = validMemories[i];
			const embedding = embeddings[i];
			if (!embedding) {
				console.warn('Embedding is not valid', memory);
				continue;
			}

			const id = `${memory.type}:${memory.chatId}:${nanoid()}`;
			const doc: EventDoc = {
				id,
				type: memory.type,
				chatId: memory.chatId,
				content: memory.content,
				createdAt: new Date().toISOString(),
				tokens: memory.tokens,
				_vectors: {
					[VOYAGE_EMBEDDER]: {
						embeddings: embedding
					}
				}
			};
			docs.push(doc);
		}

		await this.index.addDocuments(docs);
	}

	async search(
		query: string,
		tokens: number,
		chatId: string,
		days?: number,
		type?: EventType
	): Promise<EventMemory[]> {
		const limit = Math.floor(tokens / CHUNK_TOKEN_LIMIT);

		let f = `chatId = "${chatId}"`;
		if (type) f += ` AND type = "${type}"`;
		if (days) {
			const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
			f += ` AND createdAt >= "${start.toISOString()}"`;
		}

		const vector = (
			await voyage.embed({
				input: [query],
				model: EMBEDDERS.VOYAGE_LITE
			})
		).data?.[0]?.embedding;
		if (!vector) {
			console.warn('Vector is not valid', query);
			return [];
		}

		const res = await this.index.search(query, {
			vector,
			filter: f,
			limit,
			hybrid: {
				embedder: VOYAGE_EMBEDDER,
				semanticRatio: SEARCH_RATIO
			}
		});

		const memories: EventMemory[] = res.hits.map((hit) => ({
			kind: 'event',
			type: hit.type,
			chatId: hit.chatId,
			content: hit.content,
			createdAt: hit.createdAt,
			tokens: hit.tokens
		}));
		return memories;
	}
}

export const eventIndexer = new MeiliEventIndexer();
