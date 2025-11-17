<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { ArrowLeft, MessageCircle } from 'lucide-svelte';
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
</script>

<div class="flex max-h-screen flex-col gap-4 px-2 lg:flex-row">
	<div
		class="hidden w-full flex-1 flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm lg:flex lg:w-96"
	>
		<div class="flex-1 overflow-y-auto p-6">
			<EditCharacter bind:character modal={false} />
		</div>
	</div>

	<div
		class="flex flex-1 flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm"
	>
		<div class="border-b border-base-300 p-6">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<div class="flex items-center gap-3">
					<div class="avatar">
						<div
							class="size-12 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100"
						>
							<img src={headerAvatar} alt={character?.name || 'Character'} />
						</div>
					</div>
					<div>
						<h3 class="text-lg font-semibold text-base-content">
							{character?.name ?? 'Character Chat'}
						</h3>
						<p class="text-xs text-base-content/60">
							<MessageCircle class="mr-1 inline size-4 text-primary" />
							Direct conversation
						</p>
					</div>
				</div>
				<Button
					onclick={() => {
						goto(`/app/characters`);
					}}
					style="ghost"
					class="lg:hidden"
				>
					<ArrowLeft class="size-4" />
					Back
				</Button>
			</div>
		</div>

		<div class="flex-1 overflow-y-auto">
			{#if !chat}
				<div class="flex h-full items-center justify-center">
					<span class="loading loading-lg loading-spinner"></span>
				</div>
			{:else}
				<Messages {messages} {senders} class="h-full" />
			{/if}
		</div>

		<div class="border-t border-base-300 p-4 pb-14 sm:pb-6">
			<MessageControls {messages} onSend={handleSendMessage} disabled={!chat} />
		</div>
	</div>
</div>
