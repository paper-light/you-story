<script lang="ts">
	import { Plus, User } from 'lucide-svelte';
	import type { CharactersResponse } from '$lib';
	import { charactersStore, EditCharacter, CharacterCard } from '$lib/apps/character/client';
	import { Button, Modal } from '$lib/shared/ui';

	let selectedCharacter = $state<CharactersResponse | null>(null);
	let editModalOpen = $state(false);

	let isCreating = $derived(selectedCharacter === null && editModalOpen);
	let modalOpen = $derived(editModalOpen && (selectedCharacter !== null || isCreating));

	const characters = $derived(charactersStore.characters);

	function openCreateModal() {
		selectedCharacter = null;
		editModalOpen = true;
	}

	function openEditModal(character: CharactersResponse) {
		selectedCharacter = character;
		editModalOpen = true;
	}

	function handleModalClose() {
		selectedCharacter = null;
		editModalOpen = false;
	}
</script>

<div class="flex h-full flex-col">
	<div class="mb-6 flex shrink-0 items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Characters</h1>
			<p class="mt-1 text-sm text-base-content/60">
				{characters.length === 0
					? 'No characters yet'
					: `${characters.length} ${characters.length === 1 ? 'character' : 'characters'}`}
			</p>
		</div>
		<Button onclick={openCreateModal} color="primary">
			<Plus class="size-5" />
			<span>New Character</span>
		</Button>
	</div>

	{#if characters.length === 0}
		<div class="flex flex-1 flex-col items-center justify-center text-center">
			<User class="mb-4 size-16 text-base-content/20" />
			<p class="mb-2 text-lg text-base-content/60">No characters yet</p>
			<p class="mb-4 text-sm text-base-content/40">Create your first character to get started</p>
			<Button onclick={openCreateModal} color="primary">
				<Plus class="size-5" />
				<span>Create Character</span>
			</Button>
		</div>
	{:else}
		<div class="flex-1 overflow-y-auto">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each characters as character}
					<CharacterCard {character} onClick={openEditModal} />
				{/each}
			</div>
		</div>
	{/if}
</div>

<Modal
	backdrop
	placement="right"
	open={modalOpen}
	onclose={handleModalClose}
	class="max-w-2xl"
	fullHeight
>
	<EditCharacter bind:character={selectedCharacter} bind:open={editModalOpen} />
</Modal>
