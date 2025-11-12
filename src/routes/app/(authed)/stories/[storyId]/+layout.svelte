<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	import { storyEventsStore } from '$lib/apps/storyEvent/client';
	import { eventChatsStore } from '$lib/apps/eventChat/client';
	import { storiesStore } from '$lib/apps/story/client';

	import Splash from '../../Splash.svelte';

	let { children, data } = $props();
	const { storyPromise } = data;

	onMount(async () => {
		const { storyEvents, eventChats } = await storyPromise;
		if (storyEvents) storyEventsStore.setStoryEvents(storyEvents);
		if (eventChats) eventChatsStore.setEventChats(eventChats);
	});

	$effect(() => {
		const story = storiesStore.stories.find((story) => story.id === page.params.storyId);
		if (story) {
			storyEventsStore.subscribe();
			eventChatsStore.subscribe();
		}

		return () => {
			storyEventsStore.unsubscribe();
			eventChatsStore.unsubscribe();
		};
	});
</script>

{#await storyPromise}
	<Splash />
{:then}
	{@render children()}
{/await}
