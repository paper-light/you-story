<script lang="ts">
	import { X } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { pb } from '$lib';
	import { Button, uiStore } from '$lib/shared/ui';
	import { userStore, subStore } from '$lib/apps/user/client';
	import { chatsStore } from '$lib/apps/eventChat/client';
	import { charactersStore } from '$lib/apps/character/client';
	import { storiesStore } from '$lib/apps/story/client';
	import { storyEventsStore } from '$lib/apps/storyEvent/client';

	// Import profile components
	import ProfileCard from './ProfileCard.svelte';
	import SubscriptionCard from './SubscriptionCard.svelte';
	import LegalCard from './LegalCard.svelte';

	function logout() {
		// Clear stores
		pb!.authStore.clear();
		uiStore.clear();
		userStore.user = null;
		userStore.token = null;
		subStore.sub = null;
		chatsStore.setChats([]);
		charactersStore.setCharacters([]);
		storiesStore.setStories([]);
		storyEventsStore.setStoryEvents([]);

		// Redirect
		goto('/app/auth');
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-4 p-4 sm:space-y-0 sm:p-6 lg:p-4">
	<!-- Header -->
	<div class="mb-4 flex items-center justify-between sm:mb-6">
		<h1 class="mx-auto text-2xl font-bold sm:text-3xl">Profile & Settings</h1>
	</div>

	<!-- Main Grid Layout -->
	<!-- Using a centered layout for now as we don't have the analytics widgets yet -->
	<div class="mx-auto max-w-xl space-y-4">
		<ProfileCard />

		<SubscriptionCard />

		<LegalCard />

		<!-- Logout Button -->
		<Button class="mt-4 w-full" onclick={logout} style="soft" color="error">
			<X class="mr-2 h-4 w-4" />
			Logout
		</Button>
	</div>
</div>
