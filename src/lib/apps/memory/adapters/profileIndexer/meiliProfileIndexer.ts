import { Index, MeiliSearch, type UserProvidedEmbedder } from 'meilisearch';
import { MEILI_URL, MEILI_MASTER_KEY } from '$env/static/private';

import { nanoid } from '$lib/shared';

import type { ProfileMemory, ProfileIndexer } from '../../core';
import { EMBEDDERS, voyage } from '$lib/shared/server';

const BATCH_SIZE = 128;
const VOYAGE_EMBEDDER = 'voyage';
const SEARCH_RATIO = 0.75;
const CHUNK_TOKEN_LIMIT = 256;

export type ProfileDoc = {
	id: string;
	type: 'character' | 'relationship';
	characterIds: string[];
	content: string;
	createdAt: string;
	tokens: number;
	_vectors: Record<string, Record<string, number[]>>;
};

export const PROFILE_EMBEDDERS = {
	[VOYAGE_EMBEDDER]: {
		source: 'userProvided',
		dimensions: 1024
	} as UserProvidedEmbedder
};

export class MeiliProfileIndexer implements ProfileIndexer {
	private readonly client: MeiliSearch;
	private readonly index: Index<ProfileDoc>;

	constructor() {
		this.client = new MeiliSearch({
			host: MEILI_URL,
			apiKey: MEILI_MASTER_KEY
		});
		this.index = this.client.index('profiles');
	}

	async migrate(): Promise<void> {
		await this.index.updateEmbedders(PROFILE_EMBEDDERS);
		await this.index.updateFilterableAttributes(['type', 'characterIds', 'createdAt']);
	}

	async add(memories: ProfileMemory[]): Promise<void> {
		const docs: ProfileDoc[] = [];

		const validMemories = memories.filter((memory) => {
			if (memory.tokens > CHUNK_TOKEN_LIMIT) {
				console.warn('Profile memory tokens are too high', memory);
				return false;
			}
			if (memory.type === 'character') {
				if (!memory.characterIds || memory.characterIds.length !== 1) {
					console.warn('Character IDs are not valid', memory);
					return false;
				}
			}
			if (memory.type === 'relationship') {
				if (!memory.characterIds || memory.characterIds.length !== 2) {
					console.warn('Relationship is not valid', memory);
					return false;
				}
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

			const id = `${memory.type}:${memory.characterIds.join(':')}:${nanoid()}`;
			const doc: ProfileDoc = {
				id,
				type: memory.type,
				characterIds: memory.characterIds,
				content: memory.content,
				tokens: memory.tokens,
				createdAt: new Date().toISOString(),
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

	async search(query: string, tokens: number, charIds: string[]): Promise<ProfileMemory[]> {
		const limit = Math.floor(tokens / CHUNK_TOKEN_LIMIT);

		const f = `characterIds IN ["${charIds.join('","')}"]`;

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

		const memories: ProfileMemory[] = res.hits.map((hit) => ({
			kind: 'profile',
			type: hit.type,
			characterIds: hit.characterIds,
			content: hit.content,
			createdAt: hit.createdAt,
			tokens: hit.tokens
		}));
		return memories;
	}
}

export const profileIndexer = new MeiliProfileIndexer();
