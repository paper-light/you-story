<script lang="ts">
	import { charactersStore } from '$lib/apps/character/client';
	import { EventChatsCommitModeOptions, EventChatsTypeOptions } from '$lib';

	interface Props {
		povCharacter?: string;
		commitMode?: EventChatsCommitModeOptions;
		type?: EventChatsTypeOptions;
		availableCharacters?: string[];
		disabled?: boolean;
	}

	let {
		povCharacter = $bindable(''),
		commitMode = $bindable<EventChatsCommitModeOptions>(EventChatsCommitModeOptions.autoCommit),
		type = $bindable<EventChatsTypeOptions>(EventChatsTypeOptions.story),
		availableCharacters = [],
		disabled = false
	}: Props = $props();

	const typeOptions: {
		value: EventChatsTypeOptions;
		label: string;
		description: string;
	}[] = [
		{
			value: EventChatsTypeOptions.story,
			label: 'Story',
			description: 'User sets the vibe and narrative direction'
		},
		{
			value: EventChatsTypeOptions.roleplay,
			label: 'Roleplay',
			description: 'Character roleplay in the scene'
		}
	];

	const eventCharacters = $derived(
		charactersStore.characters.filter((c) => availableCharacters?.includes(c.id))
	);

	const selectedType = $derived(typeOptions.find((o) => o.value === type));

	const povCharacterId = 'pov-character-select';
	const commitModeId = 'commit-mode-select';
	const typeId = 'type-select';
</script>

<div class="space-y-4">
	<!-- Type - Required -->
	<!-- <div class="form-control">
		<label class="label" for={typeId}>
			<span class="label-text font-semibold">Mode</span>
			<span class="label-text-alt text-xs text-error">Required</span>
		</label>
		<select bind:value={type} id={typeId} class="select-bordered select w-full" {disabled}>
			{#each typeOptions as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
		<div class="label">
			<span class="label-text-alt text-xs text-base-content/60">
				{selectedType?.description}
			</span>
		</div>
	</div> -->

	<!-- POV Character - Required -->
	{#if type === EventChatsTypeOptions.roleplay}
		<div class="form-control">
			<label class="label" for={povCharacterId}>
				<span class="label-text font-semibold">POV Character</span>
			</label>
			<select
				bind:value={povCharacter}
				id={povCharacterId}
				class="select-bordered select w-full"
				{disabled}
			>
				<option value="" disabled>World (default)</option>
				{#each eventCharacters as character}
					<option value={character.id}>{character.name || 'Unnamed Character'}</option>
				{/each}
			</select>
			<div class="label">
				<span class="label-text-alt text-xs text-base-content/60">
					The character whose perspective this chat will follow
				</span>
			</div>
		</div>
	{/if}

	<!-- Info Box -->
	<div class="rounded-lg border border-info bg-info/10 p-4">
		<p class="text-sm text-info">
			Once you start the chat, you'll be able to interact with the AI to explore this event from
			your chosen character's perspective.
		</p>
	</div>
</div>
