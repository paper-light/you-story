<script lang="ts">
	import { Users } from 'lucide-svelte';
	import { charactersStore } from '$lib/apps/character/client';

	interface Props {
		name?: string;
		description?: string;
		characters?: string[];
		disabled?: boolean;
		isDirty?: boolean;
	}

	let {
		name = $bindable(''),
		description = $bindable(''),
		characters = $bindable([]),
		disabled = false,
		isDirty = $bindable(false)
	}: Props = $props();

	// Initial values for dirty tracking
	let initialName = $state('');
	let initialDescription = $state('');
	let initialCharacters = $state<string[]>([]);

	// Track dirty state
	$effect(() => {
		const charactersChanged =
			characters.length !== initialCharacters.length ||
			characters.some((id) => !initialCharacters.includes(id)) ||
			initialCharacters.some((id) => !characters.includes(id));

		isDirty = name !== initialName || description !== initialDescription || charactersChanged;
	});

	// Function to reset dirty tracking with new initial values
	export function resetDirtyTracking() {
		initialName = name;
		initialDescription = description;
		initialCharacters = [...characters];
	}

	// Initialize on mount
	$effect(() => {
		if (initialName === '' && name !== '') {
			resetDirtyTracking();
		}
	});

	const availableCharacters = $derived(charactersStore.characters);
	const eventNameId = 'event-name-input';
	const eventDescriptionId = 'event-description-input';

	function handleCharacterChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const { value, checked } = input;

		if (checked) {
			if (!characters.includes(value)) {
				characters = [...characters, value];
			}
		} else {
			characters = characters.filter((id) => id !== value);
		}
	}

	function isSelected(characterId: string) {
		return characters.includes(characterId);
	}
</script>

<div class="space-y-4">
	<!-- Event Name - Required -->
	<div class="form-control">
		<label class="label" for={eventNameId}>
			<span class="label-text font-semibold">Event Name</span>
			<span class="label-text-alt text-xs text-error">Required</span>
		</label>
		<input
			type="text"
			placeholder="The day it all began"
			bind:value={name}
			id={eventNameId}
			class="input-bordered input w-full"
			autocomplete="off"
			required
			{disabled}
		/>
	</div>

	<!-- Characters - Required -->
	<div class="form-control">
		<label class="label">
			<span class="label-text font-semibold">Characters</span>
			<span class="label-text-alt text-xs text-error">At least 1 required</span>
		</label>

		{#if availableCharacters.length === 0}
			<div
				class="rounded-lg border border-dashed border-base-300 bg-base-100 p-4 text-center text-sm text-base-content/60"
			>
				No characters available. Create them first in the Characters section.
			</div>
		{:else}
			<div class="max-h-90 space-y-2 overflow-y-auto">
				{#each availableCharacters as character}
					<label
						class={[
							'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
							isSelected(character.id)
								? 'border-primary bg-primary/10'
								: 'border-base-300 hover:bg-base-200'
						]}
					>
						<input
							type="checkbox"
							class="checkbox checkbox-sm checkbox-primary"
							value={character.id}
							checked={isSelected(character.id)}
							onchange={handleCharacterChange}
							{disabled}
						/>
						<div class="flex flex-1 items-center gap-3">
							<div class="avatar">
								<div class="w-8 rounded-full">
									<img
										src={charactersStore.getCharacterAvatar(character)}
										alt={character.name || 'Character'}
									/>
								</div>
							</div>
							<div class="flex-1">
								<span class="text-sm font-medium">{character.name || 'Unnamed'}</span>
							</div>
						</div>
					</label>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Description -->
	<div class="form-control">
		<label class="label" for={eventDescriptionId}>
			<span class="label-text font-semibold">Event Description</span>
			<span class="label-text-alt text-xs text-base-content/50">Optional</span>
		</label>
		<textarea
			rows={3}
			placeholder="Describe what happens in this opening event..."
			bind:value={description}
			id={eventDescriptionId}
			class="textarea-bordered textarea w-full"
			{disabled}
		></textarea>
	</div>
</div>
