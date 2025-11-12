<script>
	import { goto } from '$app/navigation';

	import { userStore, subStore } from '$lib/apps/user/client';
	import ThemeController from '$lib/shared/ui/ThemeController.svelte';

	import Splash from './Splash.svelte';

	const { children, data } = $props();
	const { globalPromise } = data;

	$effect(() => {
		const user = userStore.user;
		if (!user) {
			goto('/app/auth', { replaceState: true });
		}
	});

	$effect(() => {
		const userId = userStore.user?.id;
		if (userId) userStore.subscribe(userId);
		return () => userStore.unsubscribe();
	});

	$effect(() => {
		const subId = subStore.sub?.id;
		if (subId) subStore.subscribe(subId);
		return () => subStore.unsubscribe();
	});
</script>

{#await globalPromise}
	<Splash />
{:then}
	{@render children()}
{/await}
