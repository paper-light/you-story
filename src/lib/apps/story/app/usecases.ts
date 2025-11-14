import { pb, type StoryExpand, type StoriesResponse } from '$lib/shared';

import { Story, type StoryApp, type StoryBible } from '../core';

export class StoryAppImpl implements StoryApp {
	async getStory(storyId: string): Promise<Story> {
		const res: StoriesResponse<StoryBible, StoryExpand> = await pb
			.collection('stories')
			.getOne(storyId, {
				expand: 'storyEvents_via_story'
			});
		return Story.fromResponse(res);
	}
}

export const storyApp = new StoryAppImpl();
