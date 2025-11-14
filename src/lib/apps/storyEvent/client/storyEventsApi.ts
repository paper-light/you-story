import { Collections, pb, type Create, type Update } from '$lib/shared';

class StoryEventsApi {
	async create(data: Create<Collections.StoryEvents>) {
		const formData = new FormData();

		if (!data.story) throw new Error('Story is required');
		if (!data.characters || data.characters.length === 0)
			throw new Error('Characters are required');
		if (!data.story) throw new Error('Story is required');
		if (!data.name) throw new Error('Name is required');

		formData.append('story', data.story);
		formData.append('order', String(data.order ?? 1));
		formData.append('name', data.name);

		if (data.description !== undefined) formData.append('description', data.description);
		if (data.prevEventDiff !== undefined) formData.append('prevEventDiff', data.prevEventDiff);

		for (const characterId of data.characters) {
			formData.append('characters', characterId);
		}

		const record = await pb.collection(Collections.StoryEvents).create(formData);
		return record;
	}

	async update(id: string, data: Update<Collections.StoryEvents>) {
		const formData = new FormData();

		if (data.name !== undefined) formData.append('name', data.name);
		if (data.description !== undefined) formData.append('description', data.description);

		if (data.characters !== undefined) {
			for (const characterId of data.characters) {
				formData.append('characters', characterId);
			}
		}

		const record = await pb.collection(Collections.StoryEvents).update(id, formData);
		return record;
	}
}

export const storyEventsApi = new StoryEventsApi();
