<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { ArrowLeft, MessageCircle, Settings2, X } from 'lucide-svelte';
	import { MessagesRoleOptions } from '$lib';
	import { CharacterForm, charactersStore, EditCharacter } from '$lib/apps/character/client';
	import {
		chatsApi,
		chatsStore,
		messagesStore,
		Messages,
		MessageControls
	} from '$lib/apps/eventChat/client';
	import pchelImage from '$lib/shared/assets/images/pchel.png';
	import type { Sender } from '$lib/apps/eventChat/core';
	import { Button } from '$lib/shared/ui';

	const chatId = $derived(page.params.chatId);
	const characterId = $derived(page.params.characterId);

	const chat = $derived(chatsStore.chats.find((c) => c.id === chatId));

	const characters = $derived(charactersStore.characters);
	const messages = $derived(messagesStore.messages);

	let character = $derived(characters.find((c) => c.id === characterId) ?? null);

	const povCharacter = $derived(
		chat?.povCharacter ? (characters.find((c) => c.id === chat.povCharacter) ?? null) : null
	);

	const senders = $derived.by<Sender[]>(() => {
		const list: Sender[] = [];

		if (character) {
			list.push({
				id: character.id,
				name: character.name ?? 'Character',
				role: 'ai',
				avatar: charactersStore.getCharacterAvatar(character)
			});
		}

		if (povCharacter) {
			list.push({
				id: povCharacter.id,
				name: povCharacter.name ?? 'You',
				role: 'user',
				avatar: charactersStore.getCharacterAvatar(povCharacter)
			});
		}

		list.push({
			id: 'narrator',
			name: 'Narrator',
			role: 'ai',
			avatar: pchelImage
		});

		return list;
	});

	async function handleSendMessage(content: string) {
		if (!chatId || !characterId || !chat) return;

		await chatsApi.sendMessage({
			type: 'character',
			characterId,
			content,
			msg: {
				chat: chatId,
				content,
				role: MessagesRoleOptions.user,
				character: chat.povCharacter ?? undefined
			}
		});
	}

	const headerAvatar = $derived(
		character ? charactersStore.getCharacterAvatar(character) : pchelImage
	);

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
				<Button
					onclick={() => {
						goto(`/app/characters`);
					}}
					style="ghost"
					circle
					size="sm"
					class="lg:hidden"
				>
					<ArrowLeft class="size-5" />
				</Button>

				<div class="avatar">
					<div class="size-10 rounded-full ring-1 ring-base-300 ring-offset-1">
						<img src={headerAvatar} alt={character?.name || 'Character'} />
					</div>
				</div>
				<div>
					<h3 class="font-semibold text-base-content">
						{character?.name ?? 'Character Chat'}
					</h3>
					<p class="text-xs text-base-content/60">
						{#if chat}
							<span class="inline-block size-2 rounded-full bg-success align-middle"></span>
							Online
						{:else}
							Connecting...
						{/if}
					</p>
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
	<div class="bg-base-50 hidden max-w-lg shrink-0 flex-col border-l border-base-200 lg:flex">
		<div class="flex-1 overflow-y-auto p-4">
			<EditCharacter bind:character modal={false} />
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
					<h2 class="font-semibold text-base-content">Character Details</h2>
					<Button onclick={() => (showSidebar = false)} style="ghost" circle size="sm">
						<X class="size-5" />
					</Button>
				</div>
				<div class="flex-1 overflow-y-auto p-4">
					<EditCharacter bind:character modal={false} />
				</div>
			</div>
		</div>
	{/if}
</div>
