<script lang="ts">
	import { page } from '$app/state';

	let { children, data } = $props();

	const storyId = $derived(page.params.storyId);
	const eventId = $derived(page.params.eventId);
	const chatId = $derived(page.params.chatId);

	$effect(() => {
		console.log(storyId, eventId, chatId);
	});
</script>

<div>
	{@render children()}
</div>
