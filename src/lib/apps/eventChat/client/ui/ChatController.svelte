<script lang="ts">
	import { charactersStore } from '$lib/apps/character/client';
	import { storyEventsStore } from '$lib/apps/storyEvent/client';
	import { eventChatsApi } from '../eventChatsApi';
	import { Plus, X } from 'lucide-svelte';
	import type { EventChatsResponse } from '$lib';
	import { onMount } from 'svelte';

	interface Props {
		chat: EventChatsResponse<string[]>;
	}

	const { chat }: Props = $props();

	// Get event for available characters
	const event = $derived(storyEventsStore.storyEvents.find((e) => e.id === chat.storyEvent));
	const availableCharacters = $derived(
		charactersStore.characters.filter((c) => event?.characters?.includes(c.id))
	);

	// Character selection for roleplay mode
	let selectedCharacterId = $state<string>(chat.povCharacter ?? '');
	let isSavingCharacter = $state(false);

	// Notes
	let notes = $state<string[]>((chat.notes as string[]) ?? []);
	let newNote = $state('');
	let isSavingNotes = $state(false);
	let notesSaveTimeout: ReturnType<typeof setTimeout> | null = null;

	// Debounced save for notes
	function saveNotes() {
		if (notesSaveTimeout) {
			clearTimeout(notesSaveTimeout);
		}

		notesSaveTimeout = setTimeout(async () => {
			if (isSavingNotes) return;
			isSavingNotes = true;

			try {
				await eventChatsApi.update(chat.id, {
					notes: notes.length > 0 ? notes : null
				});
			} catch (error) {
				console.error('Failed to save notes:', error);
			} finally {
				isSavingNotes = false;
			}
		}, 500); // 500ms debounce
	}

	// Immediate save for character
	async function saveCharacter() {
		if (isSavingCharacter) return;
		isSavingCharacter = true;

		try {
			await eventChatsApi.update(chat.id, {
				povCharacter: selectedCharacterId || undefined
			});
		} catch (error) {
			console.error('Failed to save character:', error);
		} finally {
			isSavingCharacter = false;
		}
	}

	function handleAddNote() {
		if (!newNote.trim()) return;
		notes = [...notes, newNote.trim()];
		newNote = '';
		saveNotes();
	}

	function handleRemoveNote(index: number) {
		notes = notes.filter((_, i) => i !== index);
		saveNotes();
	}

	async function handleCharacterChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		selectedCharacterId = select.value;
		await saveCharacter();
	}

	// Sync local state with chat updates from outside
	$effect(() => {
		selectedCharacterId = chat.povCharacter ?? '';
		notes = (chat.notes as string[]) ?? [];
	});

	onMount(() => {
		return () => {
			if (notesSaveTimeout) {
				clearTimeout(notesSaveTimeout);
			}
		};
	});
</script>

<div class="space-y-4">
	<!-- Character selection for roleplay mode -->
	{#if chat.type === 'roleplay'}
		<div class="form-control">
			<label class="label" for="character-select">
				<span class="label-text font-semibold">Character</span>
				{#if isSavingCharacter}
					<span class="label-text-alt text-xs text-base-content/60">Saving...</span>
				{/if}
			</label>
			<select
				value={selectedCharacterId}
				onchange={handleCharacterChange}
				id="character-select"
				class="select-bordered select w-full"
				disabled={isSavingCharacter}
			>
				<option value="">World (default)</option>
				{#each availableCharacters as character}
					<option value={character.id}>{character.name || 'Unnamed Character'}</option>
				{/each}
			</select>
			<div class="label">
				<span class="label-text-alt text-xs text-base-content/60">
					Select character for roleplay
				</span>
			</div>
		</div>
	{/if}

	<!-- Notes -->
	<div class="form-control">
		<div class="label">
			<span class="label-text font-semibold">Notes</span>
			<span class="label-text-alt text-xs text-base-content/60">
				{#if isSavingNotes}
					Saving...
				{:else}
					Additional instructions for this chat
				{/if}
			</span>
		</div>

		<!-- Notes list -->
		{#if notes.length > 0}
			<div class="mb-2 space-y-2">
				{#each notes as note, index}
					<div class="flex items-start gap-2 rounded-lg border border-base-300 bg-base-100 p-2">
						<p class="flex-1 text-sm text-base-content">{note}</p>
						<button
							type="button"
							onclick={() => handleRemoveNote(index)}
							class="btn btn-circle btn-ghost btn-sm"
							disabled={isSavingNotes}
						>
							<X class="size-4" />
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Add note input -->
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={newNote}
				placeholder="Add a note..."
				class="input-bordered input input-sm flex-1"
				disabled={isSavingNotes}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						handleAddNote();
					}
				}}
			/>
			<button
				type="button"
				onclick={handleAddNote}
				class="btn btn-sm btn-primary"
				disabled={!newNote.trim() || isSavingNotes}
			>
				<Plus class="size-4" />
			</button>
		</div>
	</div>
</div>
