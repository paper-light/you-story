<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		eventChatsApi,
		eventChatsStore,
		messagesStore,
		ChatController
	} from '$lib/apps/eventChat/client';
	import Messages from '$lib/apps/eventChat/client/ui/Messages.svelte';
	import MessageControls from '$lib/apps/eventChat/client/ui/MessageControls.svelte';
	import { Button } from '$lib/shared/ui';
	import { ArrowLeft, MessageCircle } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { type EventChatsResponse, MessagesRoleOptions } from '$lib';
	import { userStore } from '$lib/apps/user/client';
	import { charactersStore } from '$lib/apps/character/client';

	const storyId = $derived(page.params.storyId);
	const eventId = $derived(page.params.eventId);
	const chatId = $derived(page.params.chatId);

	// Chat state
	let chat = $state<EventChatsResponse<string[]> | null>(null);
	let isLoading = $state(true);

	// Messages
	const messages = $derived(messagesStore.messages);

	const chars = $derived(charactersStore.characters);
	let povCharacter = $derived(chars.find((char) => char.id === chat?.povCharacter));

	// Senders for Messages component
	const userSender = $derived({
		id: 'user',
		name: `You (${povCharacter?.name ?? 'World'})`,
		role: 'user' as const,
		avatar: povCharacter
			? charactersStore.getCharacterAvatar(povCharacter)
			: (userStore.avatarUrl ?? '')
	});

	const assistantSenders = $derived(
		chars.map((char) => ({
			id: char.id,
			name: char.name,
			role: 'ai' as const,
			avatar: charactersStore.getCharacterAvatar(char)
		}))
	);

	// Load chat data and messages
	onMount(async () => {
		if (!chatId) {
			isLoading = false;
			return;
		}

		try {
			const loadedChat = await eventChatsStore.getById(chatId);
			chat = loadedChat as EventChatsResponse<string[]>;
		} catch (error) {
			console.error('Failed to load chat:', error);
		} finally {
			isLoading = false;
		}
	});

	function handleBack() {
		goto(`/app/stories/${storyId}/events/${eventId}/chats`);
	}

	async function handleSendMessage(content: string) {
		if (!chatId || !storyId || !eventId) return;

		await eventChatsApi.sendMessage(storyId, eventId, {
			chat: chatId,
			content,
			role: MessagesRoleOptions.user
		});
	}
</script>

<div class="flex h-[calc(100vh-4rem)] gap-6 p-3">
	<!-- Left Side: Chat Editor -->
	<div
		class="hidden w-96 flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm md:flex"
	>
		<!-- Header -->
		<div class="flex items-center gap-3 border-b border-base-300 p-6">
			<Button onclick={handleBack} size="md" style="solid" circle>
				<ArrowLeft class="size-5" />
			</Button>
			<h2 class="text-xl font-semibold text-base-content">Chat Settings</h2>
		</div>

		<!-- Form Content -->
		<div class="flex-1 overflow-y-auto p-6">
			{#if isLoading}
				<div class="flex h-full items-center justify-center">
					<span class="loading loading-lg loading-spinner"></span>
				</div>
			{:else if chat}
				<ChatController {chat} />
			{:else}
				<div class="flex h-full items-center justify-center text-base-content/60">
					Chat not found
				</div>
			{/if}
		</div>
	</div>

	<!-- Right Side: Chat Interface -->
	<div
		class="flex flex-1 flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm"
	>
		<!-- Chat Header -->
		<div class="border-b border-base-300 p-6">
			<div class="flex items-center gap-3">
				<MessageCircle class="size-6 text-primary" />
				<div>
					<h3 class="text-lg font-semibold text-base-content">Chat</h3>
					{#if chat}
						<p class="text-xs text-base-content/60">Chat #{chat.id.slice(-6)}</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Chat Messages Area -->
		<div class="flex-1 overflow-hidden">
			{#if isLoading}
				<div class="flex h-full items-center justify-center">
					<span class="loading loading-lg loading-spinner"></span>
				</div>
			{:else}
				<Messages {messages} {userSender} {assistantSenders} class="h-full" />
			{/if}
		</div>

		<!-- Chat Input Area -->
		<div class="border-t border-base-300 p-4">
			<MessageControls {messages} onSend={handleSendMessage} disabled={isLoading || !chat} />
		</div>
	</div>
</div>
