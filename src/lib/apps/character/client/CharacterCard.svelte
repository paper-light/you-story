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

<svelte:element
	this={onClick ? 'button' : 'div'}
	type={onClick ? 'button' : undefined}
	onclick={onClick ? handleClick : undefined}
	aria-label={onClick ? 'Click to view character' : undefined}
	role={onClick ? 'button' : undefined}
	tabindex={onClick ? 0 : undefined}
	class={[
		'card-bordered card bg-base-200',
		onClick ? 'group cursor-pointer transition-colors hover:bg-base-300' : ''
	].join(' ')}
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
		<h2 class={onClick || topRightAction ? 'relative card-title' : 'card-title'}>
			{character.name || 'Unnamed Character'}
		</h2>

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
</svelte:element>
