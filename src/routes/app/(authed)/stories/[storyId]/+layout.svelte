<script>
	import { afterNavigate } from '$app/navigation';
	import { uiStore } from '$lib/shared/ui';

	let { children } = $props();

	afterNavigate(() => {
		uiStore.setGlobalSidebarOpen(false);
	});
</script>

{@render children()}
