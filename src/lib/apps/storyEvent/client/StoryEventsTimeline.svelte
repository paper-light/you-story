<script lang="ts">
	import { storyEventsStore } from '$lib/apps/storyEvent/client';
	import type { StoryEventsResponse } from '$lib';
	import { Plus, Sparkles } from 'lucide-svelte';
	import { Button } from '$lib/shared/ui';
	import StoryEventItem from './StoryEventItem.svelte';

	interface Props {
		storyId: string;
		selectedEventId?: string | null;
		isCreatingNew?: boolean;
		onEventSelect?: (eventId: string | null) => void;
		onCreateEvent?: (
			prevEvent: StoryEventsResponse | null,
			nextEvent: StoryEventsResponse | null
		) => void;
	}

	let {
		storyId,
		selectedEventId = null,
		isCreatingNew = false,
		onEventSelect,
		onCreateEvent
	}: Props = $props();

	const events = $derived(storyEventsStore.storyEvents.filter((event) => event.story === storyId));

	function handleEventClick(eventId: string) {
		onEventSelect?.(eventId);
	}

	function handleCreateAfter(event: StoryEventsResponse, index: number) {
		const prevEvent = event;
		const nextEvent = events[index + 1] || null;
		onCreateEvent?.(prevEvent, nextEvent);
	}

	function handleCreateFirst() {
		const nextEvent = events[0] || null;
		onCreateEvent?.(null, nextEvent);
	}
</script>

<div class="flex h-full flex-col">
	<!-- Header -->
	<div class="flex items-center gap-2 border-b border-base-300 pb-4">
		<Sparkles class="size-5 text-primary" />
		<h2 class="text-lg font-semibold text-base-content">Events Timeline</h2>
	</div>

	<!-- Timeline List -->
	<div class="mt-4 flex-1 space-y-3 overflow-y-auto pr-2">
		{#if events.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-lg border border-dashed border-base-300 bg-base-100 p-8 text-center"
			>
				<Sparkles class="mb-3 size-12 text-base-content/20" />
				<p class="text-sm text-base-content/60">No events yet</p>
				<p class="mt-1 text-xs text-base-content/40">Create your first event to start the story</p>
				<Button onclick={handleCreateFirst} size="sm" color="primary" class="mt-4">
					<Plus class="size-4" />
					<span>Create First Event</span>
				</Button>
			</div>
		{:else}
			<!-- Create before first event -->
			<!-- <button
				onclick={handleCreateFirst}
				class={[
					'flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-2 text-sm transition-all',
					isCreatingNew && selectedEventId === null
						? 'border-primary bg-primary/10 text-primary'
						: 'border-base-300 text-base-content/50 hover:border-primary/50 hover:bg-base-200 hover:text-primary'
				].join(' ')}
			>
				<Plus class="size-4" />
				<span>Create Event</span>
			</button> -->

			{#each events as event, index (event.id)}
				<StoryEventItem
					{event}
					isActive={selectedEventId === event.id}
					onclick={() => handleEventClick(event.id)}
				/>
				<!-- Create after this event -->
				<button
					onclick={() => handleCreateAfter(event, index)}
					class={[
						'flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-2 text-sm transition-all',
						isCreatingNew && selectedEventId === event.id
							? 'border-primary bg-primary/10 text-primary'
							: 'border-base-300 text-base-content/50 hover:border-primary/50 hover:bg-base-200 hover:text-primary'
					].join(' ')}
				>
					<Plus class="size-4" />
					<span>Create Event</span>
				</button>
			{/each}
		{/if}
	</div>
</div>
