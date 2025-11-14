import type { StoryEvent } from './models';

export interface StoryEventApp {
	get(storyEventId: string): Promise<StoryEvent>;
}
