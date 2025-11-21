<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	import pchelImage from '$lib/shared/assets/images/pchel.png';
	import { chatsApi, chatsStore, messagesStore, ChatController } from '$lib/apps/eventChat/client';
	import Messages from '$lib/apps/eventChat/client/ui/Messages.svelte';
	import MessageControls from '$lib/apps/eventChat/client/ui/MessageControls.svelte';
	import { Button } from '$lib/shared/ui';
	import { ArrowLeft, MessageCircle, Settings2, X } from 'lucide-svelte';
	import { MessagesRoleOptions } from '$lib';
	import { charactersStore } from '$lib/apps/character/client';
	import type { Sender } from '$lib/apps/eventChat/core';

	const storyId = $derived(page.params.storyId);
	const eventId = $derived(page.params.eventId);
	const chatId = $derived(page.params.chatId);

	const chat = $derived(chatsStore.chats.find((chat) => chat.id === chatId));
	const messages = $derived(messagesStore.messages);

	const chars = $derived(charactersStore.characters);

	const senders = $derived.by<Sender[]>(() => {
		const senders: Sender[] = chars.map((char) => ({
			id: char.id,
			name: char.name,
			role: 'ai' as const,
			avatar: charactersStore.getCharacterAvatar(char)
		}));
		senders.unshift({
			id: '',
			name: 'World',
			role: 'ai' as const,
			avatar: pchelImage
		});

		return senders;
	});

	function handleBack() {
		goto(`/app/stories/${storyId}/events/${eventId}/chats`);
	}

	async function handleSendMessage(content: string) {
		if (!storyId || !eventId || !chat) return;

		await chatsApi.sendMessage({
			type: 'story',
			storyId,
			eventId,
			content,
			msg: {
				chat: chat.id,
				content,
				role: MessagesRoleOptions.user,
				character: chat.povCharacter ?? undefined
			}
		});
	}

	let showSidebar = $state(false);
</script>

<div class="flex h-[calc(100vh-1rem)] w-full overflow-hidden bg-base-100">
	<!-- CENTER: Chat Interface -->
	<div class="relative flex flex-1 flex-col overflow-hidden">
		<!-- Header -->
		<div
			class="flex h-16 shrink-0 items-center justify-between border-b border-base-200 bg-base-100/80 px-4 backdrop-blur-md"
		>
			<div class="flex items-center gap-3">
				<Button onclick={handleBack} style="ghost" circle size="sm" class="lg:hidden">
					<ArrowLeft class="size-5" />
				</Button>

				<div class="flex items-center gap-3">
					<div
						class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"
					>
						<MessageCircle class="size-6" />
					</div>
					<div>
						<h3 class="font-semibold text-base-content">Chat</h3>
						{#if chat}
							<p class="text-xs text-base-content/60">#{chat.id.slice(-6)}</p>
						{/if}
					</div>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<Button
					onclick={() => (showSidebar = !showSidebar)}
					style="ghost"
					circle
					size="sm"
					class="lg:hidden"
				>
					<Settings2 class="size-5" />
				</Button>
			</div>
		</div>

		<!-- Messages Area -->
		<div class="flex-1 overflow-hidden bg-base-100">
			{#if !chat}
				<div class="flex h-full items-center justify-center">
					<span class="loading loading-lg loading-spinner text-primary"></span>
				</div>
			{:else}
				<Messages {messages} {senders} class="h-full" />
			{/if}
		</div>

		<!-- Input Area -->
		<div class="shrink-0 p-4 pb-8">
			<MessageControls {messages} onSend={handleSendMessage} disabled={!chat} />
		</div>
	</div>

	<!-- RIGHT: Context Sidebar (Desktop) -->
	<div class="bg-base-50 hidden w-96 shrink-0 flex-col border-l border-base-200 lg:flex">
		<div class="flex h-16 items-center border-b border-base-200 px-6">
			<h2 class="font-semibold text-base-content">Chat Settings</h2>
		</div>
		<div class="flex-1 overflow-y-auto p-4">
			{#if chat}
				<ChatController {chat} />
			{/if}
		</div>
	</div>

	<!-- RIGHT: Context Sidebar (Mobile Drawer) -->
	{#if showSidebar}
		<div class="absolute inset-0 z-50 flex lg:hidden">
			<!-- Backdrop -->
			<div
				class="absolute inset-0 bg-black/50 backdrop-blur-sm"
				onclick={() => (showSidebar = false)}
				role="button"
				tabindex="0"
				onkeydown={(e) => e.key === 'Enter' && (showSidebar = false)}
			></div>

			<!-- Drawer Content -->
			<div class="relative ml-auto flex h-full w-96 flex-col bg-base-100 shadow-2xl">
				<div class="flex h-16 items-center justify-between border-b border-base-200 px-4">
					<h2 class="font-semibold text-base-content">Chat Settings</h2>
					<Button onclick={() => (showSidebar = false)} style="ghost" circle size="sm">
						<X class="size-5" />
					</Button>
				</div>
				<div class="flex-1 overflow-y-auto p-4">
					{#if chat}
						<ChatController {chat} />
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
