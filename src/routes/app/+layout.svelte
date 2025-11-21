<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import {
		PanelLeft,
		Plus,
		House,
		Users,
		Settings,
		ChevronLeft,
		ChevronRight,
		Heart,
		Book,
		MessageSquare,
		Play
	} from 'lucide-svelte';

	import { chatsStore } from '$lib';
	import { uiStore } from '$lib/shared/ui/ui.svelte';
	import { userStore, subStore, FeedbackForm } from '$lib/apps/user/client';
	import { storiesStore } from '$lib/apps/story/client';
	import { charactersStore } from '$lib/apps/character/client';
	import { Button, Modal, ThemeController, AuthWall, Paywall } from '$lib/shared/ui';

	import Splash from './Splash.svelte';

	const { children, data } = $props();
	const globalPromise = $derived(data.globalPromise);

	const user = $derived(userStore.user);
	const sub = $derived(subStore.sub);
	const sidebarOpen = $derived(uiStore.globalSidebarOpen);

	const navItems = [
		{ path: '/app/stories/new', icon: Plus, label: 'New Story' },
		{ path: '/app/stories', icon: Book, label: 'Stories' },
		{ path: '/app/characters', icon: Users, label: 'Characters' }
	];

	const chatSettings = $derived(uiStore.chatSettings);

	$effect(() => {
		globalPromise.then(({ user, sub, stories, characters, chats }) => {
			if (user) userStore.user = user;
			if (sub) subStore.sub = sub;
			if (stories) storiesStore.setStories(stories);
			if (characters) charactersStore.setCharacters(characters);
			if (chats) chatsStore.setChats(chats);
		});
	});

	$effect(() => {
		const userId = userStore.user?.id;
		if (userId) userStore.subscribe(userId);
		storiesStore.subscribe();
		charactersStore.subscribe();
		chatsStore.subscribe();
		return () => {
			userStore.unsubscribe();
			storiesStore.unsubscribe();
			charactersStore.unsubscribe();
			chatsStore.unsubscribe();
		};
	});

	$effect(() => {
		const subId = subStore.sub?.id;
		if (subId) subStore.subscribe(subId);
		return () => subStore.unsubscribe();
	});

	function isActive(path: string) {
		return page.url.pathname === path;
	}
</script>

{#await globalPromise}
	<Splash />
{:then}
	<div class="flex h-screen overflow-hidden bg-base-100">
		<!-- Sidebar -->
		<aside
			class={[
				'flex-col border-r border-base-300 transition-all duration-300 ease-in-out',
				'hidden md:flex'
			]}
			class:w-64={sidebarOpen}
			class:w-16={!sidebarOpen}
		>
			<!-- Header -->
			<div
				class={[
					'flex h-16 items-center border-b border-base-300 px-2',
					sidebarOpen ? 'justify-between' : 'justify-center'
				]}
			>
				{#if sidebarOpen}
					<a href="/app/stories" class="flex items-center gap-2">
						<div class="text-2xl font-bold text-primary"><Heart class="size-8 text-primary" /></div>
						<span class="text-lg font-semibold">YouStory</span>
					</a>
				{/if}
				<button
					onclick={() => uiStore.toggleGlobalSidebar()}
					class="btn btn-square btn-ghost"
					aria-label="Toggle sidebar"
				>
					{#if sidebarOpen}
						<ChevronLeft class="size-6" />
					{:else}
						<ChevronRight class="size-6" />
					{/if}
				</button>
			</div>

			<!-- Navigation -->
			<nav class="flex-1 p-1" class:overflow-y-auto={sidebarOpen}>
				<ul class="menu w-full gap-2">
					{#if chatSettings}
						<li class="w-full">
							<a
								href={uiStore.chatUrl()}
								class={[
									'btn flex w-full items-center gap-2 rounded-full btn-ghost transition-all',
									sidebarOpen ? 'btn-circle justify-start px-4' : 'justify-center',
									uiStore.chatUrl() ? (isActive(uiStore.chatUrl()!) ? 'btn-soft' : '') : ''
								]}
								title={!sidebarOpen ? 'Stories' : ''}
							>
								<Play class="block size-6 shrink-0" />
								{#if sidebarOpen}
									<span class="font-medium text-nowrap">Last Chat</span>
								{/if}
							</a>
						</li>
						<li class="separator"></li>
					{/if}

					{#each navItems as item}
						{@const Icon = item.icon}
						<li class="w-full">
							<a
								href={item.path}
								class={[
									'btn flex w-full items-center gap-2 rounded-full btn-ghost transition-all',
									sidebarOpen ? 'btn-circle justify-start px-4' : 'justify-center',
									isActive(item.path) ? 'btn-soft' : ''
								]}
								title={!sidebarOpen ? item.label : ''}
							>
								<Icon class="block size-6 shrink-0" />
								{#if sidebarOpen}
									<span class="font-medium text-nowrap">{item.label}</span>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			</nav>

			{#if user}
				<div class="mb-2 flex justify-center p-0">
					<button
						class={['btn justify-start btn-ghost', sidebarOpen ? 'btn-block' : 'btn-circle']}
						onclick={() => uiStore.toggleFeedbackModal()}
					>
						<MessageSquare class={sidebarOpen ? 'size-7' : 'mx-auto size-8'} />
						{#if sidebarOpen}
							Feedback
						{:else}
							<span class="sr-only">Feedback</span>
						{/if}
					</button>
				</div>
			{/if}
			<!-- Theme Controller -->
			<div class={['mb-2 border-base-300', sidebarOpen ? '' : 'flex justify-center']}>
				<ThemeController expanded={sidebarOpen} navStyle />
			</div>

			<!-- Profile Card -->
			<div class="border-t border-base-300">
				{#if user}
					<a
						href="/app/settings"
						class="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-base-300"
						class:justify-center={!sidebarOpen}
						title={!sidebarOpen ? 'Settings' : ''}
					>
						{#if userStore.avatarUrl}
							<img
								src={userStore.avatarUrl}
								alt={user.name}
								class="size-10 rounded-full text-center"
							/>
						{:else}
							<div
								class="flex size-10 items-center justify-center rounded-full bg-base-300 text-center"
							>
								{user.name?.at(0)?.toUpperCase() ?? 'U'}
							</div>
						{/if}

						{#if sidebarOpen}
							<div class="flex-1 overflow-hidden">
								<div class="truncate text-sm font-semibold">{user.name || 'User'}</div>
								<div class="truncate text-xs opacity-60">{user.email}</div>
							</div>
							<Settings class="size-5 opacity-60" />
						{/if}
					</a>
				{:else}
					<a
						href="/app/auth"
						class="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-base-300"
						class:justify-center={!sidebarOpen}
						title={!sidebarOpen ? 'Settings' : 'Auth'}
					>
						<p class="size-10 rounded-full bg-base-300"></p>
						{#if sidebarOpen}
							<div class="flex-1 overflow-hidden">
								<div class="truncate text-sm font-semibold">Log in</div>
							</div>
						{/if}
					</a>
				{/if}
			</div>
		</aside>

		<!-- Main Content -->
		<main class="flex-1 overflow-auto">
			<div class="mx-auto h-full max-w-7xl p-0 md:px-4 lg:px-6">
				{@render children()}
			</div>
		</main>

		<footer class="mobile-dock-footer dock dock-sm z-50 sm:hidden">
			<a href="/app/stories" data-sveltekit-preload-data="tap" class="dock-item">
				<Book class={page.url.pathname === '/app' ? 'text-primary' : 'text-neutral'} />
			</a>
			<a href="/app/characters" data-sveltekit-preload-data="tap" class="dock-item">
				<Users class={page.url.pathname === '/app/characters' ? 'text-primary' : 'text-neutral'} />
			</a>
			<div>
				<a
					href={`/app/stories/${chatSettings?.storyId}/events/${chatSettings?.eventId}/chats/${chatSettings?.chatId}`}
					class={[
						'dock-item btn-solid btn btn-circle btn-primary',
						isActive(
							`/app/stories/${chatSettings?.storyId}/events/${chatSettings?.eventId}/chats/${chatSettings?.chatId}`
						)
							? 'btn-soft'
							: ''
					]}
				>
					<Play class="block size-6 shrink-0" />
				</a>
			</div>
			<div>
				<a href="/app/stories/new" class="dock-item">
					<Plus
						size={32}
						class={page.url.pathname === '/app/stories/new' ? 'text-primary' : 'text-neutral'}
					/>
				</a>
			</div>
			<a
				href={user ? '/app/settings' : '/app/auth'}
				data-sveltekit-preload-data="tap"
				class="dock-item"
			>
				<Settings class={page.url.pathname === '/app/settings' ? 'text-primary' : 'text-neutral'} />
			</a>
		</footer>
	</div>
{/await}

<Modal
	class="max-h-[90vh] max-w-[90vw] sm:max-h-[95vh]"
	backdrop
	open={true}
	onclose={() => uiStore.setPaywallOpen(false)}
>
	<Paywall stripePrices={(data as any)?.stripePrices ?? []} />
</Modal>

<Modal
	class="max-w-md"
	backdrop
	open={uiStore.authWallOpen}
	onclose={() => uiStore.setAuthWallOpen(false)}
>
	<AuthWall />
</Modal>

<Modal
	class="max-w-2xl"
	backdrop
	open={uiStore.feedbackModalOpen}
	onclose={() => uiStore.setFeedbackModalOpen(false)}
>
	<FeedbackForm />
</Modal>
