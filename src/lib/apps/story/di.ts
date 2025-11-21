import { StoryAppImpl } from './app';
import type { StoryApp } from './core';

export const getStoryApp = (): StoryApp => {
	return new StoryAppImpl();
};
