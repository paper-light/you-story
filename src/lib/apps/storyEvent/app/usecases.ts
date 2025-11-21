import { Collections, pb, type StoryEventExpand, type StoryEventsResponse } from '$lib';

import { StoryEvent, type StoryEventApp } from '../core';

export class StoryEventAppImpl implements StoryEventApp {
	async get(storyEventId: string): Promise<StoryEvent> {
		const res: StoryEventsResponse<StoryEventExpand> = await pb
			.collection(Collections.StoryEvents)
			.getOne(storyEventId, {
				expand: 'characters'
			});
		return StoryEvent.fromResponse(res);
	}
}
