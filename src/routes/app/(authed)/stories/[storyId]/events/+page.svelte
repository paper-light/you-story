<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { storiesStore, StoryHeader, StoryForm } from '$lib/apps/story/client';
	import { storyEventsStore, EventForm, StoryEventsTimeline } from '$lib/apps/storyEvent/client';
	import { Button } from '$lib/shared/ui';
	import { Save, ExternalLink, X } from 'lucide-svelte';
	import type { StoryBible } from '$lib/apps/story/core/model';

	const storyId = $derived(page.params.storyId);
	const story = $derived(storiesStore.stories.find((s) => s.id === storyId));

	// State for selected event
	let selectedEventId = $state<string | null>(null);
	const selectedEvent = $derived(
		selectedEventId ? storyEventsStore.storyEvents.find((e) => e.id === selectedEventId) : null
	);

	// State for creating new event
	let isCreatingNew = $state(false);
	let prevEventForNew = $state<typeof selectedEvent>(null);
	let nextEventForNew = $state<typeof selectedEvent>(null);

	// Story form state
	let storyName = $state('');
	let storyDescription = $state('');
	let storyStyleText = $state('');
	let storyWorldFactsText = $state('');
	let storyCoverFile = $state<File | null>(null);
	let storyCoverPreview = $state<string | null>(null);
	let isStoryDirty = $state(false);

	// Event form state
	let eventName = $state('');
	let eventDescription = $state('');
	let eventCharacters = $state<string[]>([]);
	let isEventDirty = $state(false);

	// Saving states
	let isSavingStory = $state(false);
	let isSavingEvent = $state(false);

	// Refs to form components for resetting dirty tracking
	interface FormComponent {
		resetDirtyTracking(): void;
	}
	let storyFormRef: FormComponent | null = $state(null);
	let eventFormRef: FormComponent | null = $state(null);

	// Track current story/event IDs for dirty reset
	let currentStoryId = $state<string | null>(null);
	let currentEventId = $state<string | null>(null);
	let currentIsCreatingNew = $state(false);

	// Sync story data when story changes
	$effect(() => {
		if (story) {
			const needsReset = currentStoryId !== story.id;

			storyName = story.name ?? '';
			storyDescription = story.description ?? '';
			storyCoverPreview = storiesStore.getCoverUrl(story);

			const bible = story.bible as StoryBible | null;
			if (bible) {
				storyStyleText = bible.style?.join('\n') ?? '';
				storyWorldFactsText = bible.worldFacts?.join('\n') ?? '';
			}

			// Reset dirty tracking when story changes
			if (needsReset) {
				currentStoryId = story.id;
				// Use setTimeout to ensure form ref is available and data is set
				setTimeout(() => {
					if (storyFormRef) {
						storyFormRef.resetDirtyTracking();
					}
				}, 0);
			}
		}
	});

	// Sync event data when selected event changes
	$effect(() => {
		if (selectedEvent && !isCreatingNew) {
			const needsReset = currentEventId !== selectedEvent.id || currentIsCreatingNew;

			eventName = selectedEvent.name ?? '';
			eventDescription = selectedEvent.description ?? '';
			eventCharacters = selectedEvent.characters ?? [];

			// Reset dirty tracking when event changes
			if (needsReset) {
				currentEventId = selectedEvent.id;
				currentIsCreatingNew = false;
				// Use setTimeout to ensure form ref is available and data is set
				setTimeout(() => {
					if (eventFormRef) {
						eventFormRef.resetDirtyTracking();
					}
				}, 0);
			}
		} else if (isCreatingNew) {
			const needsReset = !currentIsCreatingNew;

			// Reset form for new event
			eventName = '';
			eventDescription = '';
			eventCharacters = [];

			// Reset dirty tracking for new event
			if (needsReset) {
				currentIsCreatingNew = true;
				currentEventId = null;
				// Use setTimeout to ensure form ref is available and data is set
				setTimeout(() => {
					if (eventFormRef) {
						eventFormRef.resetDirtyTracking();
					}
				}, 0);
			}
		}
	});

	// Reset dirty states when switching between forms
	$effect(() => {
		if (isStoryMode) {
			isEventDirty = false;
		} else {
			isStoryDirty = false;
		}
	});

	function handleEventSelect(eventId: string | null) {
		selectedEventId = eventId;
		isCreatingNew = false;
		prevEventForNew = null;
		nextEventForNew = null;
		// Dirty will be reset in $effect when event data syncs
	}

	function handleCreateEvent(prevEvent: typeof selectedEvent, nextEvent: typeof selectedEvent) {
		isCreatingNew = true;
		prevEventForNew = prevEvent;
		nextEventForNew = nextEvent;
		selectedEventId = prevEvent?.id ?? null;

		// Reset form
		eventName = '';
		eventDescription = '';
		eventCharacters = [];
	}

	function handleGoToEvent() {
		if (selectedEventId) {
			goto(`/app/stories/${storyId}/events/${selectedEventId}`);
		}
	}

	async function handleSaveStory() {
		if (!story || isSavingStory) return;

		isSavingStory = true;

		const bible: StoryBible = {
			style: storyStyleText
				.split('\n')
				.map((s) => s.trim())
				.filter(Boolean),
			worldFacts: storyWorldFactsText
				.split('\n')
				.map((s) => s.trim())
				.filter(Boolean)
		};

		try {
			await storiesStore.update(story.id, {
				name: storyName,
				description: storyDescription,
				cover: storyCoverFile ?? undefined,
				bible
			});

			// Reset dirty tracking after successful save
			if (storyFormRef) {
				storyFormRef.resetDirtyTracking();
				isStoryDirty = false;
			}
			storyCoverFile = null; // Clear cover file after save
		} catch (error) {
			console.error('Failed to update story:', error);
		} finally {
			isSavingStory = false;
		}
	}

	async function handleSaveEvent() {
		if (isSavingEvent) return;

		isSavingEvent = true;

		try {
			if (isCreatingNew) {
				// Create new event
				if (!storyId) return;

				const order = prevEventForNew ? (prevEventForNew.order ?? 0) + 1 : 1;

				await storyEventsStore.createFirstEvent({
					storyId,
					name: eventName,
					description: eventDescription,
					characters: eventCharacters,
					order
				});

				// Reset state after creation
				isCreatingNew = false;
				prevEventForNew = null;
				nextEventForNew = null;
				selectedEventId = null;
				isEventDirty = false;
			} else if (selectedEvent) {
				// Update existing event
				await storyEventsStore.update(selectedEvent.id, {
					name: eventName,
					description: eventDescription,
					characters: eventCharacters
				});

				// Reset dirty tracking after successful save
				if (eventFormRef) {
					eventFormRef.resetDirtyTracking();
					isEventDirty = false;
				}
			}
		} catch (error) {
			console.error('Failed to save event:', error);
		} finally {
			isSavingEvent = false;
		}
	}

	function handleCloseEventPreview() {
		selectedEventId = null;
		isCreatingNew = false;
		prevEventForNew = null;
		nextEventForNew = null;
		isEventDirty = false;
		// Story form dirty tracking will reset when story mode becomes active
	}

	const isStoryMode = $derived(selectedEventId === null && !isCreatingNew);
	const isEventMode = $derived(!isStoryMode);
	const showSaveButton = $derived(
		(isStoryMode && isStoryDirty) || (isEventMode && (isEventDirty || isCreatingNew))
	);
</script>

<div class="blok h-[calc(100vh-4rem)] gap-6 p-6 md:flex">
	<!-- Left Side: Story Info + Events Timeline -->
	<div class="flex w-96 flex-2 flex-col gap-6">
		<!-- Story Header -->
		<div class="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
			{#if story}
				<StoryHeader {story} onclick={handleCloseEventPreview} />
			{/if}
		</div>

		<!-- Events Timeline -->
		<div class="flex-1 overflow-hidden rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
			{#if storyId}
				<StoryEventsTimeline
					{storyId}
					{selectedEventId}
					{isCreatingNew}
					onEventSelect={handleEventSelect}
					onCreateEvent={handleCreateEvent}
				/>
			{/if}
		</div>
	</div>

	<!-- Right Side: Editable Form -->
	<div
		class="flex flex-2 flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm"
	>
		<!-- Form Header -->
		<div class="flex items-center justify-between border-b border-base-300 p-6">
			<h2 class="text-xl font-semibold text-base-content">
				{#if isStoryMode}
					Story Details
				{:else if isCreatingNew}
					Create New Event
				{:else}
					Event Preview
				{/if}
			</h2>
			<div class="flex items-center gap-2">
				{#if isEventMode}
					<Button onclick={handleCloseEventPreview} size="md" style="solid" circle>
						<X class="size-6" />
					</Button>
					{#if selectedEventId && !isCreatingNew}
						<Button onclick={handleGoToEvent} size="md" style="solid" color="primary">
							<ExternalLink class="size-4" />
							<span>Open Event</span>
						</Button>
					{/if}
				{/if}
				{#if showSaveButton}
					<Button
						onclick={isStoryMode ? handleSaveStory : handleSaveEvent}
						size="md"
						color="primary"
						disabled={isStoryMode ? isSavingStory : isSavingEvent}
					>
						{#if isStoryMode ? isSavingStory : isSavingEvent}
							<span class="loading loading-sm loading-spinner"></span>
						{:else}
							<Save class="size-4" />
						{/if}
						<span>{isCreatingNew ? 'Create' : 'Save'}</span>
					</Button>
				{/if}
			</div>
		</div>

		<!-- Form Content -->
		<div class="flex-1 overflow-y-auto p-6">
			{#if isStoryMode}
				<!-- Story Form -->
				<StoryForm
					bind:this={storyFormRef}
					bind:name={storyName}
					bind:description={storyDescription}
					bind:styleText={storyStyleText}
					bind:worldFactsText={storyWorldFactsText}
					bind:coverFile={storyCoverFile}
					bind:coverPreview={storyCoverPreview}
					bind:isDirty={isStoryDirty}
				/>
			{:else if isEventMode}
				<!-- Event Form (Create or Edit) -->
				<EventForm
					bind:this={eventFormRef}
					bind:name={eventName}
					bind:description={eventDescription}
					bind:characters={eventCharacters}
					bind:isDirty={isEventDirty}
				/>
				{#if isCreatingNew}
					<div class="mt-4 rounded-lg border border-info bg-info/10 p-4">
						<p class="text-sm text-info">
							Creating new event
							{#if prevEventForNew}
								after <strong>{prevEventForNew.name || 'Unnamed Event'}</strong>
							{:else}
								at the beginning
							{/if}
						</p>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
