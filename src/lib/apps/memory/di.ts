import type { StoryApp } from '$lib/apps/story/core';
import type { CharacterApp } from '$lib/apps/character/core';

import { MeiliProfileIndexer, MeiliEventIndexerAdapter } from './adapters';
import type { MemoryApp } from './core';
import { MemoryAppImpl } from './app';

export const getMemoryApp = (storyApp: StoryApp, characterApp: CharacterApp): MemoryApp => {
	const profileIndexer = new MeiliProfileIndexer();
	const eventIndexer = new MeiliEventIndexerAdapter();

	Promise.all([profileIndexer.migrate(), eventIndexer.migrate()]).then(() => {
		console.log('Memory indexers migrated');
	});

	return new MemoryAppImpl(profileIndexer, eventIndexer, storyApp, characterApp);
};
