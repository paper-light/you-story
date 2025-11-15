<script lang="ts">
	import { ChevronsDown } from 'lucide-svelte';
	import type { ClassValue } from 'svelte/elements';
	import { fade } from 'svelte/transition';

	import { Button, scrollToBottom, type MessagesResponse } from '$lib';
	import type { Sender } from '$lib/apps/eventChat/core';

	import Message from './Message.svelte';

	interface Props {
		messages: MessagesResponse[];
		userSender: Sender;
		assistantSenders: Sender[];
		class?: ClassValue;
	}

	const { class: className, messages, userSender, assistantSenders }: Props = $props();

	let messagesContainer: HTMLElement | null = $state(null);
	let showScrollButton = $state(false);

	let lastLength = 0;
	$effect(() => {
		if (messages.length > lastLength) setTimeout(() => scrollToBottom(messagesContainer), 100);
		lastLength = messages.length;
	});

	function onscroll() {
		if (!messagesContainer) return;
		const { scrollTop, clientHeight, scrollHeight } = messagesContainer;
		const atBottom = scrollTop + clientHeight >= scrollHeight - 5;
		showScrollButton = !atBottom;
	}
</script>

<div class={[className, 'relative h-full bg-base-100']}>
	<div
		bind:this={messagesContainer}
		{onscroll}
		class={['flex h-full flex-col space-y-2 overflow-y-auto overscroll-contain px-4 py-1']}
	>
		{#if messages.length === 0}
			<div class="flex h-full flex-col items-center justify-center text-center">
				<div class="mb-4 text-6xl">💬</div>
				<p class="mb-3 text-lg font-medium text-base-content/70">No messages yet, waiting...</p>
			</div>
		{:else}
			{#each messages as msg (msg)}
				{@const incoming = msg.role !== 'user'}
				{@const sender =
					msg.role === 'user'
						? userSender
						: assistantSenders.find((s) => s.id === msg.character) || assistantSenders[0]}
				<Message
					class={['max-w-7/8', !incoming && 'ml-auto']}
					{msg}
					{incoming}
					{sender}
					showHeader={Boolean(msg.character)}
				/>
			{/each}
		{/if}

		{#if showScrollButton}
			<div class="absolute right-1/2 bottom-2 z-10 translate-x-1/2" transition:fade>
				<Button
					circle
					color="neutral"
					size="xs"
					class="opacity-40 hover:opacity-70"
					onclick={() => scrollToBottom(messagesContainer)}
				>
					<ChevronsDown size={16} />
				</Button>
			</div>
		{/if}
	</div>
</div>
