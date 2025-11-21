import { type Index, MeiliSearch, type UserProvidedEmbedder } from 'meilisearch';
import { MEILI_URL, MEILI_MASTER_KEY } from '$env/static/private';

import { nanoid } from '$lib/shared';
import { EMBEDDERS, voyage } from '$lib/shared/server';

import type { ProfileMemory, ProfileIndexer, ProfileType, Importance } from '../../core';
import { building } from '$app/environment';

const BATCH_SIZE = 128;

const VOYAGE_EMBEDDER = 'voyage';
const OUTPUT_DIMENSION = 1024;
const SEARCH_RATIO = 0.75;
const CHUNK_TOKEN_LIMIT = 256;

export type ProfileDoc = {
	id: string;
	type: ProfileType;
	characterIds: string[];
	content: string;
	createdAt: string;
	tokens: number;
	importance: Importance;
	charactersCount: number;
	_vectors: Record<string, number[]>;
};

export const PROFILE_EMBEDDERS = {
	[VOYAGE_EMBEDDER]: {
		source: 'userProvided',
		dimensions: OUTPUT_DIMENSION
	} as UserProvidedEmbedder
};

export class MeiliProfileIndexer implements ProfileIndexer {
	private readonly client?: MeiliSearch;
	private readonly index?: Index<ProfileDoc>;

	constructor() {
		if (building) return;
		this.client = new MeiliSearch({
			host: MEILI_URL,
			apiKey: MEILI_MASTER_KEY
		});
		this.index = this.client.index('profiles');
	}

	async migrate(): Promise<void> {
		if (!this.index) return;
		await this.index.updateEmbedders(PROFILE_EMBEDDERS);
		await this.index.updateFilterableAttributes([
			'type',
			'characterIds',
			'createdAt',
			'importance',
			'charactersCount'
		]);
	}

	async add(memories: ProfileMemory[]): Promise<void> {
		if (!this.index) return;
		if (memories.length === 0) {
			console.log('No profile memories to index');
			return;
		}

		const docs: ProfileDoc[] = [];

		const validMemories = memories.filter((memory) => {
			if (memory.tokens > CHUNK_TOKEN_LIMIT) {
				console.warn('Profile memory tokens are too high', memory);
				return false;
			}
			if (memory.characterIds.length === 0 || memory.characterIds.length > 2) {
				console.warn('Character IDs are not valid', memory);
				return false;
			}
			return true;
		});

		if (validMemories.length === 0) {
			console.warn('No valid profile memories after filtering');
			return;
		}

		console.log(`Indexing ${validMemories.length} profile memories`);

		const embedTasks = [];
		for (let i = 0; i < validMemories.length; i += BATCH_SIZE) {
			const batch = validMemories.slice(i, i + BATCH_SIZE).map((memory) => memory.content);
			embedTasks.push(
				voyage.embed({
					input: batch,
					model: EMBEDDERS.VOYAGE_LITE,
					inputType: 'document',
					outputDimension: OUTPUT_DIMENSION
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

			const id = `${memory.type}-${memory.characterIds.join('-')}-${nanoid()}`;
			const doc: ProfileDoc = {
				id,
				type: memory.type,
				characterIds: memory.characterIds,
				charactersCount: memory.characterIds.length,
				content: memory.content,
				tokens: memory.tokens,
				importance: memory.importance,
				createdAt: new Date().toISOString(),
				_vectors: {
					[VOYAGE_EMBEDDER]: embedding
				}
			};
			docs.push(doc);
		}

		if (docs.length === 0) {
			console.warn('No documents to add after processing embeddings');
			return;
		}

		try {
			const task = await this.index.addDocuments(docs, { primaryKey: 'id' });
			console.log(
				`Successfully indexed ${docs.length} profile documents. Task ID: ${task.taskUid}`
			);
		} catch (error) {
			console.error('Error indexing profile documents:', error);
			throw error;
		}
	}

	async search(query: string, tokens: number, charIds: string[]): Promise<ProfileMemory[]> {
		const limit = Math.floor(tokens / CHUNK_TOKEN_LIMIT);

		const f = this.buildProfilesFilter(charIds);

		const vector = (
			await voyage.embed({
				input: [query],
				model: EMBEDDERS.VOYAGE_LITE,
				inputType: 'document',
				outputDimension: OUTPUT_DIMENSION
			})
		).data?.[0]?.embedding;
		if (!vector) {
			console.warn('Vector is not valid', query);
			return [];
		}

		const res = await this.index!.search(query, {
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
			tokens: hit.tokens,
			importance: hit.importance
		}));
		return memories;
	}

	private buildProfilesFilter(charIds: string[]): string {
		if (charIds.length === 0) return '';

		const personalFilter = `(charactersCount = 1 AND characterIds IN ["${charIds.join('","')}"])`;

		const pairFilters: string[] = [];

		for (let i = 0; i < charIds.length; i++) {
			for (let j = i + 1; j < charIds.length; j++) {
				const a = charIds[i];
				const b = charIds[j];

				pairFilters.push(
					`(charactersCount = 2 AND characterIds IN ["${a}"] AND characterIds IN ["${b}"])`
				);
			}
		}

		if (pairFilters.length === 0) {
			return personalFilter;
		}

		return `${personalFilter} OR ${pairFilters.join(' OR ')}`;
	}
}
