import { pb, type StoryEventsRecord, type StoryEventsResponse } from '$lib';

interface CreateFirstEventInput extends Omit<Partial<StoryEventsRecord>, 'characters' | 'story'> {
	storyId: string;
	characters?: string[];
}

class StoryEventsStore {
	async createFirstEvent(data: CreateFirstEventInput): Promise<StoryEventsResponse> {
		const formData = new FormData();

		formData.append('story', data.storyId);
		formData.append('order', String(data.order ?? 1));

		if (data.name !== undefined) formData.append('name', data.name);
		if (data.description !== undefined) formData.append('description', data.description);
		if (data.prevEventDiff !== undefined) formData.append('prevEventDiff', data.prevEventDiff);

		for (const characterId of data.characters ?? []) {
			formData.append('characters', characterId);
		}

		const record = await pb!.collection('storyEvents').create(formData);
		return record as StoryEventsResponse;
	}
}

export const storyEventsStore = new StoryEventsStore();
