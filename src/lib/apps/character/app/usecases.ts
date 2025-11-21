import { Collections, pb } from '$lib/shared';

import { Character, type CharacterApp } from '../core';

export class CharacterAppImpl implements CharacterApp {
	async getByIds(ids: string[]): Promise<Character[]> {
		const tasks = ids.map((id) => pb.collection(Collections.Characters).getOne(id));
		const recs = await Promise.all(tasks);
		return recs.map((rec) => Character.fromResponse(rec));
	}
}
