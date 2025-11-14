<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, Sparkles } from 'lucide-svelte';
	import { StoryForm, storiesApi, storiesStore } from '$lib/apps/story/client';
	import { EventForm, storyEventsStore } from '$lib/apps/storyEvent/client';
	import type { StoryBible } from '$lib/apps/story/core/models';
	import { userStore } from '$lib/apps/user/client';
	import { Button } from '$lib/shared/ui';
	import { storyEventsApi } from '$lib/apps/storyEvent/client/storyEventsApi';

	const user = $derived(userStore.user);

	let storyName = $state('');
	let storyDescription = $state('');
	let styleText = $state('');
	let worldFactsText = $state('');
	let coverFile: File | null = $state(null);
	let coverPreview: string | null = $state(null);

	let eventName = $state('');
	let eventDescription = $state('');
	let eventCharacters = $state<string[]>([]);

	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);

	const canSubmit = $derived(
		!isSubmitting && storyName.trim() && eventName.trim() && eventCharacters.length > 0
	);

	function parseMultiline(value: string) {
		return value
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);
	}

	async function handleSubmit() {
		if (!canSubmit) return;

		errorMessage = null;
		isSubmitting = true;

		try {
			const bible: StoryBible = {
				style: parseMultiline(styleText),
				worldFacts: parseMultiline(worldFactsText)
			};

			const story = await storiesApi.create({
				name: storyName.trim() || undefined,
				description: storyDescription.trim() || undefined,
				cover: coverFile ?? undefined,
				user: user?.id,
				bible
			});

			await storyEventsApi.create({
				story: story.id,
				name: eventName.trim() || undefined,
				description: eventDescription.trim() || undefined,
				characters: eventCharacters,
				order: 1
			});

			goto(`/app/stories/${story.id}/events`);
		} catch (error) {
			console.error('Failed to create story', error);
			errorMessage =
				error instanceof Error ? error.message : 'Something went wrong while creating the story.';
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel() {
		goto('/app/stories');
	}
</script>

<div class="relative flex h-full flex-col pb-24">
	<!-- Header -->
	<header class="mb-6 flex items-center gap-4">
		<Button onclick={handleCancel} style="ghost" color="neutral" size="sm" class="shrink-0">
			<ArrowLeft class="size-4" />
		</Button>
		<div class="flex-1">
			<h1 class="text-2xl font-bold">Create Your Story</h1>
			<p class="mt-1 text-sm text-base-content/60">
				Fill in the essentials to begin your adventure
			</p>
		</div>
	</header>

	{#if errorMessage}
		<div class="mb-4 alert alert-error">
			<span class="text-sm">{errorMessage}</span>
		</div>
	{/if}

	<!-- Forms Grid -->
	<div class="flex-1 overflow-y-auto">
		<div class="grid gap-6 lg:grid-cols-5">
			<!-- Story Section -->
			<div class="col-span-3 space-y-3 p-2">
				<div class="flex items-center gap-2">
					<div class="h-8 w-1 rounded-full bg-primary"></div>
					<h2 class="text-lg font-semibold">Story Details</h2>
				</div>
				<StoryForm
					bind:name={storyName}
					bind:description={storyDescription}
					bind:styleText
					bind:worldFactsText
					bind:coverFile
					bind:coverPreview
					disabled={isSubmitting}
				/>
			</div>

			<!-- Event Section -->
			<div class="col-span-2 space-y-3 p-2">
				<div class="flex items-center gap-2">
					<div class="h-8 w-1 rounded-full bg-secondary"></div>
					<h2 class="text-lg font-semibold">Opening Event</h2>
				</div>
				<EventForm
					bind:name={eventName}
					bind:description={eventDescription}
					bind:characters={eventCharacters}
					disabled={isSubmitting}
				/>
			</div>
		</div>
	</div>

	<!-- Floating Action Button -->
	<div
		class="fixed inset-x-0 bottom-0 border-t border-base-300 bg-base-100/95 p-4 backdrop-blur-sm lg:absolute"
	>
		<div class="mx-auto flex max-w-7xl items-center justify-between gap-4">
			<div class="hidden flex-1 sm:block">
				<p class="text-sm text-base-content/60">
					{#if !storyName.trim()}
						Enter a story name to continue
					{:else if !eventName.trim()}
						Enter an event name to continue
					{:else if eventCharacters.length === 0}
						Select at least one character
					{:else}
						Ready to create your story
					{/if}
				</p>
			</div>
			<Button
				onclick={handleSubmit}
				color="primary"
				size="lg"
				disabled={!canSubmit}
				class={['w-full sm:w-auto', 'mb-12 sm:mb-0']}
			>
				{#if isSubmitting}
					<div class="loading loading-sm loading-spinner"></div>
					<span>Creating...</span>
				{:else}
					<Sparkles class="size-5" />
					<span>Start Adventure</span>
				{/if}
			</Button>
		</div>
	</div>
</div>
