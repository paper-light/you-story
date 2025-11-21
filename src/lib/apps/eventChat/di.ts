import type { MemoryApp } from '$lib/apps/memory/core';
import type { SceneApp } from '$lib/apps/scene/core';

import type { ChatApp } from './core';
import { ChatAppImpl } from './app';

export const getChatApp = (memoryApp: MemoryApp, sceneApp: SceneApp): ChatApp => {
	return new ChatAppImpl(memoryApp, sceneApp);
};
