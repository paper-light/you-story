import { Collections, pb, type StoryEventExpand, type StoryEventsResponse } from '$lib';

import { StoryEvent, type StoryEventApp } from '../core';

class StoryEventAppImpl implements StoryEventApp {
	async get(storyEventId: string): Promise<StoryEvent> {
		const res: StoryEventsResponse<StoryEventExpand> = await pb
			.collection(Collections.StoryEvents)
			.getOne(storyEventId, {
				expand: 'characters'
			});
		return StoryEvent.fromResponse(res);
	}
}

export const storyEventApp = new StoryEventAppImpl();
