<script lang="ts">
	import { goto } from '$app/navigation';
	import { BookOpenCheck, Plus } from 'lucide-svelte';
	import type { StoriesResponse } from '$lib';
	import { StoryCard, storiesStore } from '$lib/apps/story/client';
	import { Button } from '$lib/shared/ui';

	const stories = $derived(storiesStore.stories);

	function handleCreateStory() {
		goto('/app/stories/new');
	}

	function handleStoryClick(story: StoriesResponse) {
		goto(`/app/stories/${story.id}/events`);
	}
</script>

<div class="flex h-full flex-col">
	<!-- Header -->
	<div class="mb-6 flex shrink-0 items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Stories</h1>
			<p class="mt-1 text-sm text-base-content/60">
				{stories.length === 0
					? 'No stories yet'
					: `${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`}
			</p>
		</div>
		<Button onclick={handleCreateStory} color="primary">
			<Plus class="size-5" />
			<span>Create Story</span>
		</Button>
	</div>

	<!-- Content -->
	{#if stories.length === 0}
		<div class="flex flex-1 flex-col items-center justify-center text-center">
			<BookOpenCheck class="mb-4 size-16 text-base-content/20" />
			<p class="mb-2 text-lg font-semibold text-base-content/60">No stories yet</p>
			<p class="mb-6 text-sm text-base-content/40">Start by creating your first story</p>
			<Button onclick={handleCreateStory} color="primary" size="lg">
				<Plus class="size-5" />
				<span>Create Story</span>
			</Button>
		</div>
	{:else}
		<div class="flex-1 overflow-y-auto">
			<div class="grid grid-cols-1 gap-5 pb-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
				{#each stories as story (story.id)}
					<StoryCard {story} onClick={handleStoryClick} />
				{/each}
			</div>
		</div>
	{/if}
</div>
