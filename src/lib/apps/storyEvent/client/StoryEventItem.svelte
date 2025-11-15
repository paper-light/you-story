<script lang="ts">
	import type { StoryEventsResponse } from '$lib';
	import { Calendar, Users } from 'lucide-svelte';

	interface Props {
		index: number;
		event: StoryEventsResponse;
		isActive?: boolean;
		onclick?: () => void;
	}

	let { index, event, isActive = false, onclick }: Props = $props();
</script>

<button
	{onclick}
	class={[
		'group w-full cursor-pointer rounded-lg border p-4 text-left transition-all',
		isActive
			? 'border-primary bg-primary/10 shadow-md'
			: 'border-base-300 bg-base-100 hover:border-primary/50 hover:bg-base-200'
	].join(' ')}
>
	<div class="flex items-start gap-3">
		<!-- Order Badge -->
		<div
			class={[
				'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
				isActive ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content'
			].join(' ')}
		>
			{index + 1}
		</div>

		<!-- Event Content -->
		<div class="flex-1 space-y-2">
			<h3
				class={[
					'leading-tight font-semibold',
					isActive ? 'text-primary' : 'text-base-content group-hover:text-primary'
				].join(' ')}
			>
				{event.name || 'Unnamed Event'}
			</h3>

			{#if event.description}
				<p class="line-clamp-2 text-xs text-base-content/60">
					{event.description}
				</p>
			{/if}

			<!-- Meta Info -->
			<div class="flex items-center gap-3 text-xs text-base-content/50">
				{#if event.characters && event.characters.length > 0}
					<div class="flex items-center gap-1">
						<Users class="size-3" />
						<span>{event.characters.length}</span>
					</div>
				{/if}
				<div class="flex items-center gap-1">
					<Calendar class="size-3" />
					<span>{new Date(event.created).toLocaleDateString()}</span>
				</div>
			</div>
		</div>
	</div>
</button>
