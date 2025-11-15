import { Collections, pb, type Create, type Update } from '$lib/shared';

class StoryEventsApi {
	async create(data: Create<Collections.StoryEvents>, prevEventId: string, nextEventId: string) {
		const formData = new FormData();

		if (!data.story) throw new Error('Story is required');
		if (!data.characters || data.characters.length === 0)
			throw new Error('Characters are required');
		if (!data.name) throw new Error('Name is required');
		if (!prevEventId) throw new Error('Previous event is required');
		if (!nextEventId) throw new Error('Next event is required');
		if (!data.order) throw new Error('Order is required');

		formData.append('story', data.story);
		formData.append('order', String(data.order));
		formData.append('name', data.name);
		formData.append('prev', prevEventId);

		if (data.description !== undefined) formData.append('description', data.description);
		if (data.prevEventDiff !== undefined) formData.append('prevEventDiff', data.prevEventDiff);

		for (const characterId of data.characters) {
			formData.append('characters', characterId);
		}

		const batch = pb.createBatch();
		batch.collection(Collections.StoryEvents).update(prevEventId, {
			next: data.id
		});
		batch.collection(Collections.StoryEvents).update(nextEventId, {
			prev: data.id
		});
		batch.collection(Collections.StoryEvents).create(formData);
		const results = await batch.send();

		return results.at(-1);
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
