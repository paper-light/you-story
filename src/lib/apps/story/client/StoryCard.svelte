<script lang="ts">
	import { BookOpen, Calendar } from 'lucide-svelte';

	import type { StoriesResponse } from '$lib';

	import { storiesStore } from './stories.svelte';

	interface Props {
		story: StoriesResponse;
		onClick?: (story: StoriesResponse) => void;
	}

	let { story, onClick }: Props = $props();

	function handleClick() {
		onClick?.(story);
	}

	const coverUrl = $derived(storiesStore.getCoverUrl(story));

	const lastUpdated = $derived(() => {
		const value = story.updated ?? story.created;
		if (!value) return '';
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString();
	});
</script>

{#if onClick}
	<button
		type="button"
		onclick={handleClick}
		class="card-bordered group card cursor-pointer overflow-hidden border-base-300 bg-base-200 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
	>
		<!-- Cover Image -->
		<figure class="relative aspect-video w-full overflow-hidden bg-base-300">
			{#if coverUrl}
				<img
					src={coverUrl}
					alt={story.name || 'Story cover'}
					class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
				/>
			{:else}
				<div
					class="flex size-full items-center justify-center bg-linear-to-br from-primary/20 to-primary/5"
				>
					<BookOpen class="size-16 text-primary/40" />
				</div>
			{/if}
		</figure>

		<!-- Content -->
		<div class="card-body gap-3 p-5">
			<div class="min-h-0 flex-1">
				<h2 class="mb-2 card-title text-lg leading-tight font-bold text-balance">
					{story.name || 'Untitled Story'}
				</h2>

				{#if story.description}
					<p class="line-clamp-2 text-sm leading-relaxed text-base-content/70">
						{story.description}
					</p>
				{:else}
					<p class="text-sm text-base-content/40 italic">No description yet</p>
				{/if}
			</div>

			<!-- Footer -->
			{#if lastUpdated()}
				<div
					class="flex items-center gap-1.5 border-t border-base-300 pt-3 text-xs text-base-content/50"
				>
					<Calendar class="size-3.5" />
					<span>Updated {lastUpdated()}</span>
				</div>
			{/if}
		</div>
	</button>
{:else}
	<div class="card-bordered card overflow-hidden border-base-300 bg-base-200">
		<!-- Cover Image -->
		<figure class="relative aspect-video w-full overflow-hidden bg-base-300">
			{#if coverUrl}
				<img src={coverUrl} alt={story.name || 'Story cover'} class="size-full object-cover" />
			{:else}
				<div
					class="flex size-full items-center justify-center bg-linear-to-br from-primary/20 to-primary/5"
				>
					<BookOpen class="size-16 text-primary/40" />
				</div>
			{/if}
		</figure>

		<!-- Content -->
		<div class="card-body gap-3 p-5">
			<div class="min-h-0 flex-1">
				<h2 class="mb-2 card-title text-lg leading-tight font-bold text-balance">
					{story.name || 'Untitled Story'}
				</h2>

				{#if story.description}
					<p class="line-clamp-2 text-sm leading-relaxed text-base-content/70">
						{story.description}
					</p>
				{:else}
					<p class="text-sm text-base-content/40 italic">No description yet</p>
				{/if}
			</div>

			<!-- Footer -->
			{#if lastUpdated()}
				<div
					class="flex items-center gap-1.5 border-t border-base-300 pt-3 text-xs text-base-content/50"
				>
					<Calendar class="size-3.5" />
					<span>Updated {lastUpdated()}</span>
				</div>
			{/if}
		</div>
	</div>
{/if}
