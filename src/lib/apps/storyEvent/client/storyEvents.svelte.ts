import { pb, type StoryEventsRecord, type StoryEventsResponse } from '$lib';

interface CreateFirstEventInput extends Omit<Partial<StoryEventsRecord>, 'characters' | 'story'> {
	storyId: string;
	characters?: string[];
}

class StoryEventsStore {
	_storyEvents: StoryEventsResponse[] = $state([]);

	storyEvents = $derived(this._storyEvents);

	setStoryEvents(storyEvents: StoryEventsResponse[]) {
		this._storyEvents = storyEvents;
	}

	addStoryEvent(storyEvent: StoryEventsResponse) {
		const existing = this._storyEvents.filter((item) => item.id !== storyEvent.id);
		this._storyEvents = [storyEvent, ...existing];
	}

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

	async update(
		id: string,
		data: Partial<Omit<StoryEventsRecord, 'characters'>> & { characters?: string[] }
	): Promise<StoryEventsResponse> {
		const formData = new FormData();

		if (data.name !== undefined) formData.append('name', data.name);
		if (data.description !== undefined) formData.append('description', data.description);
		if (data.order !== undefined) formData.append('order', String(data.order));
		if (data.prevEventDiff !== undefined) formData.append('prevEventDiff', data.prevEventDiff);
		if (data.story !== undefined) formData.append('story', data.story);

		if (data.characters !== undefined) {
			for (const characterId of data.characters) {
				formData.append('characters', characterId);
			}
		}

		const record = await pb!.collection('storyEvents').update(id, formData);
		return record as StoryEventsResponse;
	}

	async subscribe() {
		return pb.collection('storyEvents').subscribe('*', (e) => {
			switch (e.action) {
				case 'create':
					this._storyEvents = this._storyEvents.filter((item) => !item.id.startsWith('temp-'));
					this._storyEvents.push(e.record);
					break;
				case 'update':
					this._storyEvents = this._storyEvents.map((item) =>
						item.id === e.record.id ? e.record : item
					);
					break;
				case 'delete':
					this._storyEvents = this._storyEvents.filter((item) => item.id !== e.record.id);
					break;
			}
		});
	}

	unsubscribe() {
		pb.collection('storyEvents').unsubscribe();
	}
}

export const storyEventsStore = new StoryEventsStore();
