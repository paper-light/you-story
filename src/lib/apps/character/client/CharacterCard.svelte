<script lang="ts">
	import { Trash } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	import type { CharactersResponse } from '$lib';
	import { Button } from '$lib/shared/ui';

	import { charactersStore } from './characters.svelte';
	interface Props {
		character: CharactersResponse;
		topRightAction?: Snippet;
		onClick?: (character: CharactersResponse) => void;
	}

	let { character, onClick, topRightAction }: Props = $props();

	function handleClick() {
		onClick?.(character);
	}
</script>

{#if onClick}
	<button
		onclick={handleClick}
		class="card-bordered group card cursor-pointer bg-base-200 transition-colors hover:bg-base-300"
	>
		<figure class="px-6 pt-6">
			<div class="avatar">
				<div class="w-24 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
					<img
						src={charactersStore.getCharacterAvatar(character)}
						alt={character.name || 'Character'}
					/>
				</div>
			</div>
		</figure>
		<div class="card-body items-center text-center">
			<h2 class="relative card-title">{character.name || 'Unnamed Character'}</h2>

			{#if topRightAction}
				<p class="absolute top-0 right-0">
					{@render topRightAction()}
				</p>
			{/if}

			{#if character.age !== undefined}
				<p class="text-sm text-base-content/60">Age: {character.age}</p>
			{/if}
			{#if character.description}
				<p class="line-clamp-2 text-sm text-base-content/60">{character.description}</p>
			{/if}
		</div>
	</button>
{:else}
	<div class="card-bordered card bg-base-200">
		<figure class="px-6 pt-6">
			<div class="avatar">
				<div class="w-24 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
					<img
						src={charactersStore.getCharacterAvatar(character)}
						alt={character.name || 'Character'}
					/>
				</div>
			</div>
		</figure>
		<div class="card-body items-center text-center">
			<h2 class="card-title">{character.name || 'Unnamed Character'}</h2>
			{#if character.age !== undefined}
				<p class="text-sm text-base-content/60">Age: {character.age}</p>
			{/if}
			{#if character.description}
				<p class="line-clamp-2 text-sm text-base-content/60">{character.description}</p>
			{/if}
		</div>
	</div>
{/if}
