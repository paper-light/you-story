<script lang="ts">
	import { charactersStore } from '$lib/apps/character/client';
	import { ChatsCommitModeOptions, ChatsTypeOptions } from '$lib';

	interface Props {
		povCharacter?: string;
		commitMode?: ChatsCommitModeOptions;
		type?: ChatsTypeOptions;
		availableCharacters?: string[];
		disabled?: boolean;
	}

	let {
		povCharacter = $bindable(''),
		commitMode = $bindable<ChatsCommitModeOptions>(ChatsCommitModeOptions.autoCommit),
		type = $bindable<ChatsTypeOptions>(ChatsTypeOptions.story),
		availableCharacters = [],
		disabled = false
	}: Props = $props();

	const typeOptions: {
		value: ChatsTypeOptions;
		label: string;
		description: string;
	}[] = [
		{
			value: ChatsTypeOptions.story,
			label: 'Story',
			description: 'User sets the vibe and narrative direction'
		},
		{
			value: ChatsTypeOptions.roleplay,
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

<div class="card bg-base-100">
	<div class="card-body space-y-6 p-0">
		<!-- Type - Required -->
		<!-- <div class="form-control w-full">
			<label class="label" for={typeId}>
				<span class="label-text font-semibold">Mode</span>
				<span class="label-text-alt text-error">Required</span>
			</label>
			<select bind:value={type} id={typeId} class="select select-bordered select-primary w-full" {disabled}>
				{#each typeOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
			<div class="label">
				<span class="label-text-alt text-base-content/60">
					{selectedType?.description}
				</span>
			</div>
		</div> -->

		<!-- POV Character - Required -->
		{#if type === ChatsTypeOptions.roleplay}
			<div class="form-control w-full">
				<label class="label" for={povCharacterId}>
					<span class="label-text font-semibold">POV Character</span>
				</label>
				<select
					bind:value={povCharacter}
					id={povCharacterId}
					class="select-bordered select w-full select-primary"
					{disabled}
				>
					<option value="" disabled>World (default)</option>
					{#each eventCharacters as character}
						<option value={character.id}>{character.name || 'Unnamed Character'}</option>
					{/each}
				</select>
				<div class="label">
					<span class="label-text-alt text-base-content/60">
						The character whose perspective this chat will follow
					</span>
				</div>
			</div>
		{/if}

		<!-- Info Box -->
		<div class="alert alert-info shadow-sm">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="h-6 w-6 shrink-0 stroke-current"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				></path></svg
			>
			<span class="text-sm"
				>Once you start the chat, you'll be able to interact with the AI to explore this event from
				your chosen character's perspective.</span
			>
		</div>
	</div>
</div>
