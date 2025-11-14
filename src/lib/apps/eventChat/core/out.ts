import type { Story } from '$lib/apps/story/core';
import type { StoryEvent } from '$lib/apps/storyEvent/core';

import type { EventChat } from './models';
import type { MessageChunk } from './models';

export interface Storyteller {
	streamStory(story: Story, storyEvent: StoryEvent, chat: EventChat): ReadableStream<MessageChunk>;
}
