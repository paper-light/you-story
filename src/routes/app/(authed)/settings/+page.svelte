<script lang="ts">
	import { goto } from '$app/navigation';
	import { LogOut } from 'lucide-svelte';
	import { pb } from '$lib';
	import { userStore, subStore } from '$lib/apps/user/client';

	const user = $derived(userStore.user);
	const sub = $derived(subStore.sub);
	const avatarUrl = $derived(userStore.avatarUrl);

	function logout() {
		pb!.authStore.clear();
		userStore.user = null;
		userStore.token = null;
		subStore.sub = null;
		goto('/app/auth');
	}
</script>

<div class="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold sm:text-3xl">Profile & Settings</h1>
	</div>

	<!-- Profile Card -->
	<div class="card bg-base-100 shadow-lg">
		<div class="card-body">
			<h2 class="card-title">Profile</h2>
			<div class="flex items-center gap-4">
				{#if avatarUrl}
					<img src={avatarUrl} alt={user?.name || 'User'} class="size-16 rounded-full" />
				{:else}
					<div
						class="flex size-16 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary"
					>
						{(user?.name || user?.email || 'U')[0].toUpperCase()}
					</div>
				{/if}
				<div class="flex-1">
					<div class="text-lg font-semibold">{user?.name || 'User'}</div>
					<div class="text-sm text-base-content/70">{user?.email}</div>
					{#if user?.verified === false}
						<div class="mt-1 badge badge-sm badge-warning">Email not verified</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Subscription Card -->
	{#if sub}
		<div class="card bg-base-100 shadow-lg">
			<div class="card-body">
				<h2 class="card-title">Subscription</h2>
				<div class="space-y-2">
					<div class="flex justify-between">
						<span class="text-base-content/70">Status:</span>
						<span class="badge badge-success">{sub.status || 'Active'}</span>
					</div>
					{#if sub.pointsLimit !== undefined}
						<div class="flex justify-between">
							<span class="text-base-content/70">Points Usage:</span>
							<span class="font-medium">
								{sub.pointsUsage || 0} / {sub.pointsLimit}
							</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Logout Button -->
	<div class="card bg-base-100 shadow-lg">
		<div class="card-body">
			<button onclick={logout} class="btn w-full btn-outline btn-error">
				<LogOut class="h-4 w-4" />
				Logout
			</button>
		</div>
	</div>
</div>
