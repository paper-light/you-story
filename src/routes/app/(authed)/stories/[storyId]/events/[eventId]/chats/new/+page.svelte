<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { storyEventsStore } from '$lib/apps/storyEvent/client';
	import { eventChatsStore, ChatForm, eventChatsApi } from '$lib/apps/eventChat/client';
	import { Button } from '$lib/shared/ui';
	import { ArrowLeft, Rocket } from 'lucide-svelte';
	import {
		EventChatsCommitModeOptions,
		EventChatsStatusOptions,
		EventChatsTypeOptions
	} from '$lib';

	const storyId = $derived(page.params.storyId);
	const eventId = $derived(page.params.eventId);
	const event = $derived(storyEventsStore.storyEvents.find((e) => e.id === eventId));

	// Form state
	let commitMode = $derived<EventChatsCommitModeOptions>(
		eventChatsStore.eventChats.length > 0
			? EventChatsCommitModeOptions.noncanonical
			: EventChatsCommitModeOptions.autoCommit
	);
	let type = $state<EventChatsTypeOptions>(EventChatsTypeOptions.roleplay);
	let povCharacter = $state('');
	let isCreating = $state(false);

	const canCreate = $derived(true);

	function handleBack() {
		goto(`/app/stories/${storyId}/events/${eventId}/chats`);
	}

	async function handleStartChat() {
		if (!canCreate || !eventId || isCreating) return;

		isCreating = true;

		try {
			const chat = await eventChatsApi.create({
				storyEvent: eventId,
				povCharacter,
				commitMode,
				type,
				status: EventChatsStatusOptions.inProgress
			});

			// Redirect to the chat page
			goto(`/app/stories/${storyId}/events/${eventId}/chats/${chat.id}`);
		} catch (error) {
			console.error('Failed to create chat:', error);
			isCreating = false;
		}
	}
</script>

<div class="flex h-[calc(100vh-4rem)] items-center justify-center p-6">
	<div class="w-full max-w-2xl">
		<!-- Card -->
		<div class="rounded-xl border border-base-300 bg-base-100 shadow-lg">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-base-300 p-6">
				<div class="flex items-center gap-3">
					<Button onclick={handleBack} size="md" style="solid" circle>
						<ArrowLeft class="size-5" />
					</Button>
					<div>
						<h2 class="text-xl font-semibold text-base-content">Start New Chat</h2>
						{#if event}
							<p class="text-sm text-base-content/60">
								{event.name || '<Unnamed Event>'}
							</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Form Content -->
			<div class="p-6">
				{#if event}
					<ChatForm bind:povCharacter bind:type availableCharacters={event.characters ?? []} />

					<!-- Action Button -->
					<div class="mt-6 flex justify-end">
						<Button
							onclick={handleStartChat}
							size="lg"
							color="primary"
							disabled={!canCreate || isCreating}
						>
							{#if isCreating}
								<span class="loading loading-sm loading-spinner"></span>
							{:else}
								<Rocket class="size-5" />
							{/if}
							<span>Start Chat</span>
						</Button>
					</div>
				{:else}
					<div class="flex h-full items-center justify-center py-12 text-base-content/60">
						Event not found
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
