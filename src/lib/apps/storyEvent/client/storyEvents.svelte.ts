import { Collections, pb, type StoryEventsResponse } from '$lib';

class StoryEventsStore {
	_storyEvents: StoryEventsResponse[] = $state([]);

	storyEvents = $derived(this._storyEvents);

	setStoryEvents(storyEvents: StoryEventsResponse[]) {
		this._storyEvents = storyEvents;
	}

	async subscribe() {
		return pb.collection(Collections.StoryEvents).subscribe('*', (e) => {
			switch (e.action) {
				case 'create':
					this._storyEvents = this._storyEvents.filter((item) => !item.id.startsWith('temp-'));
					this._storyEvents.push(e.record);
					this._storyEvents.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
		pb.collection(Collections.StoryEvents).unsubscribe();
	}
}

export const storyEventsStore = new StoryEventsStore();
