<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { uiStore } from '$lib';
	import { messagesStore } from '$lib/apps/eventChat/client/messages.svelte.js';

	let { children, data } = $props();

	const chatId = $derived(page.params.chatId);

	afterNavigate(() => {
		if (!page.params.storyId || !page.params.eventId || !page.params.chatId) return;
		uiStore.setChatSettings(page.params.storyId, page.params.eventId, page.params.chatId, 'story');
	});

	$effect(() => {
		if (!chatId) return;
		messagesStore.load(chatId).then(() => {
			messagesStore.subscribe(chatId);
		});

		return () => {
			messagesStore.unsubscribe();
		};
	});
</script>

<div>
	{@render children()}
</div>
