import type { ChatApp } from '$lib/apps/eventChat/core';
import type { SceneApp } from '$lib/apps/scene/core';
import type { StoryEventApp } from '$lib/apps/storyEvent/core';
import type { StoryApp } from '$lib/apps/story/core';
import type { CharacterApp } from '$lib/apps/character/core';
import type { MemoryApp } from '$lib/apps/memory/core';

import { getSceneApp } from '$lib/apps/scene/di';
import { getCharacterApp } from '$lib/apps/character/di';
import { getChatApp } from '$lib/apps/eventChat/di';
import { getMemoryApp } from '$lib/apps/memory/di';
import { getStoryEventApp } from '$lib/apps/storyEvent/di';
import { getStoryApp } from '$lib/apps/story/di';

export type DI = {
	// Globals

	// Chat
	chat: ChatApp;

	// Scene
	scene: SceneApp;

	// Memory
	memory: MemoryApp;

	// Character
	character: CharacterApp;

	// Story
	story: StoryApp;

	// StoryEvent
	storyEvent: StoryEventApp;
};

let di: DI | null = null;

export const getDI = (): DI => {
	if (di) return di;

	const characterApp = getCharacterApp();
	const storyApp = getStoryApp();
	const storyEventApp = getStoryEventApp();

	const sceneApp = getSceneApp();
	const memoryApp = getMemoryApp(storyApp, characterApp);
	const chatApp = getChatApp(memoryApp, sceneApp);

	di = {
		chat: chatApp,
		scene: sceneApp,
		memory: memoryApp,
		character: characterApp,
		story: storyApp,
		storyEvent: storyEventApp
	};
	return di;
};
