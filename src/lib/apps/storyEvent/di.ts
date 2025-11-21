import type { StoryEventApp } from './core';
import { StoryEventAppImpl } from './app';

export const getStoryEventApp = (): StoryEventApp => {
	return new StoryEventAppImpl();
};
