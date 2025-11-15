import { pb } from '$lib';

export async function loadStoryContext(storyId: string) {
	const storyEvents = await pb
		.collection('storyEvents')
		.getFullList({ filter: `story = "${storyId}"`, sort: 'order' });

	const eventChats = await pb.collection('eventChats').getFullList({
		filter: `storyEvent.story = "${storyId}"`,
		expand: 'storyEvent',
		sort: '-created'
	});
	return { storyEvents, eventChats };
}
