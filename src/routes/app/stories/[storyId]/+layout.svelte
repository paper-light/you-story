<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	import { storyEventsStore } from '$lib/apps/storyEvent/client';
	import { chatsStore } from '$lib/apps/eventChat/client';
	import { storiesStore } from '$lib/apps/story/client';

	import Splash from '../../Splash.svelte';

	let { children, data } = $props();
	const { storyPromise } = data;

	onMount(async () => {
		const { storyEvents, storyChats } = await storyPromise;
		if (storyEvents) storyEventsStore.setStoryEvents(storyEvents);
		if (storyChats) chatsStore.mergeChats(storyChats);
	});

	$effect(() => {
		const story = storiesStore.stories.find((story) => story.id === page.params.storyId);
		if (story) {
			storyEventsStore.subscribe();
			chatsStore.subscribe();
		}

		return () => {
			storyEventsStore.unsubscribe();
			chatsStore.unsubscribe();
		};
	});
</script>

{#await storyPromise}
	<Splash />
{:then}
	{@render children()}
{/await}
