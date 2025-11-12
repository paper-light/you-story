<script lang="ts">
	import { storiesStore } from './stories.svelte';
	import type { StoriesResponse } from '$lib';
	import { BookOpen } from 'lucide-svelte';

	interface Props {
		story: StoriesResponse;
		onclick?: () => void;
	}

	let { story, onclick }: Props = $props();

	const coverUrl = $derived(storiesStore.getCoverUrl(story));
	const isClickable = $derived(onclick !== undefined);

	function handleKeydown(event: KeyboardEvent) {
		if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			onclick?.();
		}
	}
</script>

<div
	class="flex flex-col gap-4"
	class:cursor-pointer={isClickable}
	class:hover:opacity-80={isClickable}
	{onclick}
	onkeydown={isClickable ? handleKeydown : undefined}
	role={isClickable ? 'button' : undefined}
	tabindex={isClickable ? 0 : undefined}
>
	<!-- Cover Image -->
	<!-- {#if coverUrl}
		<div class="relative h-48 w-full overflow-hidden rounded-xl">
			<img src={coverUrl} alt={story.name} class="h-full w-full object-cover" />
			<div class="absolute inset-0 bg-linear-to-t from-base-300/80 to-transparent"></div>
		</div>
	{/if} -->

	<!-- Story Info -->
	<div class="space-y-2">
		<div class="flex items-start gap-3">
			{#if !coverUrl}
				<div class="rounded-lg bg-primary/10 p-3">
					<BookOpen class="size-6 text-primary" />
				</div>
			{/if}
			<div class="flex-1">
				<h1 class="text-2xl font-bold text-base-content">
					{story.name || 'Untitled Story'}
				</h1>
				{#if story.description}
					<p class="mt-2 line-clamp-3 text-sm text-base-content/70">
						{story.description}
					</p>
				{/if}
			</div>
		</div>
	</div>
</div>
