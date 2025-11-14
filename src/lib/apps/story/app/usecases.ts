import { pb } from '$lib/shared';

import { Story, type StoryApp } from '../core';

export class StoryAppImpl implements StoryApp {
	async getStory(storyId: string): Promise<Story> {
		const res = await pb.collection('stories').getOne(storyId);
		return Story.fromResponse(res);
	}
}

export const storyApp = new StoryAppImpl();
