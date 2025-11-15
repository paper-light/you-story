<script lang="ts">
	import { Send } from 'lucide-svelte';
	import type { ClassValue } from 'svelte/elements';

	import { Button } from '$lib/shared/ui';
	import type { MessagesResponse } from '$lib';

	interface Props {
		messages: MessagesResponse[];
		disabled?: boolean;
		class?: ClassValue;
		onSend: (content: string) => void | Promise<void>;
	}

	const { messages, disabled = false, class: className, onSend }: Props = $props();

	let content = $state('');
	let isSending = $state(false);

	const canSend = $derived.by(() => {
		if (!content.trim()) return false;
		if (isSending) return false;

		if (messages.length === 0) return true;
		const lastMessage = messages[messages.length - 1];
		return lastMessage.role === 'ai' && lastMessage.status === 'final';
	});

	async function handleSend() {
		if (!canSend) return;

		isSending = true;
		try {
			await onSend(content.trim());
			content = '';
		} catch (error) {
			console.error('Failed to send message:', error);
		} finally {
			isSending = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}
</script>

<div class={['flex gap-2', className]}>
	<textarea
		bind:value={content}
		onkeydown={handleKeydown}
		placeholder="Type your message..."
		class="textarea-bordered textarea flex-1 resize-none"
		rows="3"
		disabled={disabled || isSending}
	></textarea>
	<Button
		onclick={handleSend}
		size="md"
		color="primary"
		disabled={disabled || !canSend}
		class="self-end"
	>
		{#if isSending}
			<span class="loading loading-sm loading-spinner"></span>
		{:else}
			<Send class="size-4" />
		{/if}
		<span>Send</span>
	</Button>
</div>
