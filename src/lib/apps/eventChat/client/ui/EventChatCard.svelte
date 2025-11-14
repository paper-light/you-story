<script lang="ts">
	import type { EventChatsResponse } from '$lib';
	import { MessageCircle, CheckCircle, Edit3 } from 'lucide-svelte';

	interface Props {
		chat: EventChatsResponse;
		isActive?: boolean;
		onclick?: () => void;
	}

	let { chat, isActive = false, onclick }: Props = $props();

	const statusLabels = {
		inProgress: 'In Progress',
		fixed: 'Fixed',
		draft: 'Draft'
	};

	const statusColors = {
		inProgress: 'badge-warning',
		fixed: 'badge-success',
		draft: 'badge-ghost'
	};
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svelte:element
	this={onclick ? 'button' : 'div'}
	type={onclick ? 'button' : undefined}
	{onclick}
	class={[
		'group w-full rounded-lg border p-4 text-left transition-all',
		onclick ? 'cursor-pointer' : '',
		isActive
			? 'border-primary bg-primary/10 shadow-md'
			: 'border-base-300 bg-base-100 hover:border-primary/50 hover:bg-base-200'
	].join(' ')}
>
	<div class="flex items-start gap-3">
		<!-- Icon -->
		<div
			class={[
				'flex size-8 shrink-0 items-center justify-center rounded-full',
				isActive ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content'
			].join(' ')}
		>
			{#if chat.status === 'fixed'}
				<CheckCircle class="size-4" />
			{:else if chat.status === 'draft'}
				<Edit3 class="size-4" />
			{:else}
				<MessageCircle class="size-4" />
			{/if}
		</div>

		<!-- Content -->
		<div class="flex-1 space-y-2">
			<div class="flex items-center justify-between gap-2">
				<h3
					class={[
						'leading-tight font-semibold',
						isActive ? 'text-primary' : 'text-base-content group-hover:text-primary'
					].join(' ')}
				>
					Chat #{chat.id.slice(-6)}
				</h3>
				<span class={['badge badge-sm', statusColors[chat.status]].join(' ')}>
					{statusLabels[chat.status]}
				</span>
			</div>

			<!-- Meta Info -->
			<div class="flex items-center gap-3 text-xs text-base-content/50">
				<span>{new Date(chat.created).toLocaleDateString()}</span>
				{#if chat.commitMode}
					<span class="capitalize">{chat.commitMode}</span>
				{/if}
			</div>
		</div>
	</div>
</svelte:element>
