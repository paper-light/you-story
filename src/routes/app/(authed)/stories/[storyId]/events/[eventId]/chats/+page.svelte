<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { storyEventsStore, EventForm } from '$lib/apps/storyEvent/client';
	import { eventChatsStore, EventChatsList } from '$lib/apps/eventChat/client';
	import { Button } from '$lib/shared/ui';
	import { Save, ArrowLeft } from 'lucide-svelte';
	import { storyEventsApi } from '$lib/apps/storyEvent/client/storyEventsApi';

	const storyId = $derived(page.params.storyId);
	const eventId = $derived(page.params.eventId);
	const event = $derived(storyEventsStore.storyEvents.find((e) => e.id === eventId));

	// Event form state
	let eventName = $state('');
	let eventDescription = $state('');
	let eventCharacters = $state<string[]>([]);
	let isEventDirty = $state(false);
	let isSavingEvent = $state(false);

	// Ref to form component for resetting dirty tracking
	interface FormComponent {
		resetDirtyTracking(): void;
	}
	let eventFormRef: FormComponent | null = $state(null);

	// Sync event data when event changes
	$effect(() => {
		if (event) {
			eventName = event.name ?? '';
			eventDescription = event.description ?? '';
			eventCharacters = event.characters ?? [];

			// Reset dirty tracking
			setTimeout(() => {
				if (eventFormRef) {
					eventFormRef.resetDirtyTracking();
				}
			}, 0);
		}
	});

	async function handleSaveEvent() {
		if (!event || isSavingEvent) return;

		isSavingEvent = true;

		try {
			await storyEventsApi.update(event.id, {
				name: eventName,
				description: eventDescription,
				characters: eventCharacters
			});

			// Reset dirty tracking after successful save
			if (eventFormRef) {
				eventFormRef.resetDirtyTracking();
				isEventDirty = false;
			}
		} catch (error) {
			console.error('Failed to save event:', error);
		} finally {
			isSavingEvent = false;
		}
	}

	function handleBackToEvents() {
		goto(`/app/stories/${storyId}/events`);
	}

	function handleChatSelect(chatId: string) {
		goto(`/app/stories/${storyId}/events/${eventId}/chats/${chatId}`);
	}

	function handleCreateChat() {
		goto(`/app/stories/${storyId}/events/${eventId}/chats/new`);
	}
</script>

<div class="flex h-[calc(100vh-4rem)] gap-6 p-6">
	<!-- Left Side: Event Form -->
	<div
		class="flex w-96 flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm"
	>
		<!-- Form Header -->
		<div class="flex items-center justify-between border-b border-base-300 p-6">
			<div class="flex items-center gap-3">
				<Button onclick={handleBackToEvents} size="md" style="solid" circle>
					<ArrowLeft class="size-5" />
				</Button>
				<h2 class="text-xl font-semibold text-base-content">Event Details</h2>
			</div>
			{#if isEventDirty}
				<Button onclick={handleSaveEvent} size="md" color="primary" disabled={isSavingEvent}>
					{#if isSavingEvent}
						<span class="loading loading-sm loading-spinner"></span>
					{:else}
						<Save class="size-4" />
					{/if}
					<span>Save</span>
				</Button>
			{/if}
		</div>

		<!-- Form Content -->
		<div class="flex-1 overflow-y-auto p-6">
			{#if event}
				<EventForm
					bind:this={eventFormRef}
					bind:name={eventName}
					bind:description={eventDescription}
					bind:characters={eventCharacters}
					bind:isDirty={isEventDirty}
				/>
			{:else}
				<div class="flex h-full items-center justify-center text-base-content/60">
					Event not found
				</div>
			{/if}
		</div>
	</div>

	<!-- Right Side: Chats List -->
	<div
		class="flex flex-1 flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm"
	>
		{#if eventId}
			<EventChatsList {eventId} onChatSelect={handleChatSelect} onCreateChat={handleCreateChat} />
		{/if}
	</div>
</div>
