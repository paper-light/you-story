<script lang="ts">
	import { ChevronsDown } from 'lucide-svelte';
	import type { ClassValue } from 'svelte/elements';
	import { fade } from 'svelte/transition';

	import { Button, scrollToBottom, type MessagesResponse } from '$lib';
	import type { Sender } from '$lib/apps/eventChat/core';

	import Message from './Message.svelte';
	import { onMount } from 'svelte';

	interface Props {
		messages: MessagesResponse[];
		senders: Sender[];
		class?: ClassValue;
	}

	const { class: className, messages, senders }: Props = $props();

	let messagesContainer: HTMLElement | null = $state(null);
	let showScrollButton = $state(false);

	let lastLength = 0;
	$effect(() => {
		setTimeout(() => scrollToBottom(messagesContainer), 100);
		lastLength = messages.length;
	});

	function onscroll() {
		if (!messagesContainer) return;
		const { scrollTop, clientHeight, scrollHeight } = messagesContainer;
		const atBottom = scrollTop + clientHeight >= scrollHeight - 50; // Increased threshold
		showScrollButton = !atBottom;
	}

	onMount(() => {
		setTimeout(() => scrollToBottom(messagesContainer), 100);
	});
</script>

<div class={[className, 'relative h-full bg-base-100']}>
	<div
		bind:this={messagesContainer}
		{onscroll}
		class={['flex h-full flex-col overflow-y-auto overscroll-contain scroll-smooth']}
	>
		<div class="mx-auto flex min-h-full w-full max-w-3xl flex-col space-y-6 px-4 pt-10 pb-4">
			{#if messages.length === 0}
				<div class="flex flex-1 flex-col items-center justify-center text-center opacity-50">
					<div class="filter mb-4 text-6xl grayscale">💬</div>
					<p class="text-lg font-medium">Start a conversation...</p>
				</div>
			{:else}
				{#each messages as msg, index (msg.id)}
					{@const incoming = msg.role !== 'user'}
					{@const sender = senders.find((s) => s.id === msg.character) || senders.at(-1)!}
					<Message
						charSeq={index > 0 &&
							messages.at(index - 1)?.character === msg.character &&
							messages.at(index - 1)?.role === msg.role}
						class={['w-full']}
						{msg}
						{incoming}
						{sender}
						showHeader={Boolean(msg.character) || msg.role === 'user'}
					/>
				{/each}
			{/if}
		</div>

		{#if showScrollButton}
			<div class="absolute right-8 bottom-4 z-10" transition:fade>
				<Button
					circle
					color="neutral"
					size="sm"
					class="opacity-80 shadow-lg hover:opacity-100"
					onclick={() => scrollToBottom(messagesContainer)}
				>
					<ChevronsDown size={16} />
				</Button>
			</div>
		{/if}
	</div>
</div>
