import { loadStoryContext } from '$lib/apps/story/client';

export async function load({ params }) {
	const storyPromise = loadStoryContext(params.storyId);
	return { storyPromise };
}
