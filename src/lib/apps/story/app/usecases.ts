import {
	pb,
	type StoryExpand,
	type StoriesResponse,
	Collections,
	type ChatExpand,
	type ChatsResponse
} from '$lib/shared';

import { Story, type StoryApp, type StoryBible } from '../core';

export class StoryAppImpl implements StoryApp {
	async getByChat(chatId: string): Promise<Story> {
		const res: ChatsResponse<StoryBible, ChatExpand> = await pb
			.collection(Collections.Chats)
			.getOne(chatId, {
				expand: 'storyEvent'
			});
		const event = res.expand?.storyEvent;
		if (!event) throw new Error(`Story event not found for chat ${chatId}`);

		const res2: StoriesResponse<StoryBible, StoryExpand> = await pb
			.collection(Collections.Stories)
			.getOne(event.story, {
				expand: 'storyEvents_via_story'
			});
		return Story.fromResponse(res2, event.order);
	}
}
