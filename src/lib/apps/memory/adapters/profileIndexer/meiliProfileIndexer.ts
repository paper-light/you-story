import { Index, MeiliSearch, type UserProvidedEmbedder } from 'meilisearch';
import { MEILI_URL, MEILI_MASTER_KEY } from '$env/static/private';

import { nanoid } from '$lib/shared';

import type { ProfileMemory, ProfileIndexer, ProfileType, Relationship } from '../../core';

export type ProfileDoc = {
	id: string;
	type: 'character' | 'user' | 'relationship';
	userId?: string;
	characterId?: string;
	relationship?: Relationship;
	content: string;
	createdAt: string;
};

export const PROFILE_EMBEDDERS = {
	voyage: {
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
		await this.index.updateFilterableAttributes(['type', 'userId', 'characterIds', 'createdAt']);
	}

	async add(memories: ProfileMemory[]): Promise<void> {
		const docs: ProfileDoc[] = [];
		for (const memory of memories) {
			if (memory.type === 'character') {
				if (!memory.characterId) {
					console.warn('Character IDs are not valid', memory);
					continue;
				}
			} else if (memory.type === 'user') {
				if (!memory.userId) {
					console.warn('User ID is not valid', memory);
					continue;
				}
			} else if (memory.type === 'relationship') {
				if (!memory.relationship) {
					console.warn('Relationship is not valid', memory);
					continue;
				}
			}

			const id = `${memory.type}:${memory.userId ?? ''}:${memory.characterId ?? ''}:${nanoid()}`;
			const doc: ProfileDoc = {
				id,
				type: memory.type,
				userId: memory.userId,
				characterId: memory.characterId,
				relationship: memory.relationship,
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
		type?: ProfileType,
		userId?: string,
		characterId?: string,
		relationships?: Relationship[]
	): Promise<ProfileMemory[]> {
		let f = ``;
		if (type) f += `type = "${type}"`;
		if (userId) f += `${f ? ' AND ' : ''}userId = "${userId}"`;
		if (characterId) f += `${f ? ' AND ' : ''}characterId = "${characterId}"`;
		if (relationships) f += `${f ? ' AND ' : ''}relationship = "${JSON.stringify(relationships)}"`;

		const res = await this.index.search(query, {
			filter: f,
			limit,
			hybrid: {
				embedder: 'voyage',
				semanticRatio: 0.5
			}
		});
		const memories: ProfileMemory[] = res.hits.map((hit) => ({
			kind: 'profile',
			type: hit.type,
			userId: hit.userId ?? undefined,
			characterId: hit.characterId ?? undefined,
			relationship: hit.relationship ?? undefined,
			content: hit.content,
			createdAt: hit.createdAt
		}));
		return memories;
	}
}

export const profileIndexer = new MeiliProfileIndexer();
