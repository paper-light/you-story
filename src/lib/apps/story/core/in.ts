import type { Story } from './models';

export interface StoryApp {
	getStory(storyId: string): Promise<Story>;
}
