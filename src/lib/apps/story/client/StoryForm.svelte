<script lang="ts">
	import { ImagePlus, Trash2, Upload } from 'lucide-svelte';
	import { Button } from '$lib/shared/ui';

	interface Props {
		name?: string;
		description?: string;
		styleText?: string;
		worldFactsText?: string;
		coverFile?: File | null;
		coverPreview?: string | null;
		disabled?: boolean;
		isDirty?: boolean;
	}

	let {
		name = $bindable(''),
		description = $bindable(''),
		styleText = $bindable(''),
		worldFactsText = $bindable(''),
		coverFile = $bindable(null),
		coverPreview = $bindable(null),
		disabled = false,
		isDirty = $bindable(false)
	}: Props = $props();

	// Initial values for dirty tracking
	let initialName = $state('');
	let initialDescription = $state('');
	let initialStyleText = $state('');
	let initialWorldFactsText = $state('');
	let initialCoverPreview = $state<string | null>(null);

	// Track dirty state
	$effect(() => {
		isDirty =
			name !== initialName ||
			description !== initialDescription ||
			styleText !== initialStyleText ||
			worldFactsText !== initialWorldFactsText ||
			coverFile !== null ||
			coverPreview !== initialCoverPreview;
	});

	// Function to reset dirty tracking with new initial values
	export function resetDirtyTracking() {
		initialName = name;
		initialDescription = description;
		initialStyleText = styleText;
		initialWorldFactsText = worldFactsText;
		initialCoverPreview = coverPreview;
		coverFile = null; // Reset cover file
	}

	// Initialize on mount
	$effect(() => {
		if (initialName === '' && name !== '') {
			resetDirtyTracking();
		}
	});

	const hasCover = $derived(coverPreview !== null);
	const storyNameId = 'story-name-input';
	const storyDescriptionId = 'story-description-input';
	const styleId = 'story-style-input';
	const worldFactsId = 'story-worldfacts-input';
	const coverInputId = 'story-cover-input';

	function handleCoverChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		coverFile = file;

		const reader = new FileReader();
		reader.onload = (loadEvent) => {
			coverPreview = loadEvent.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	function removeCover() {
		coverFile = null;
		coverPreview = null;
	}
</script>

<div class="space-y-4">
	<!-- Story Name - Required -->
	<div class="form-control">
		<label class="label" for={storyNameId}>
			<span class="label-text font-semibold">Story Name</span>
			<span class="label-text-alt text-xs text-error">Required</span>
		</label>
		<input
			type="text"
			placeholder="My unforgettable adventure"
			bind:value={name}
			id={storyNameId}
			class="input-bordered input w-full"
			autocomplete="off"
			required
			{disabled}
		/>
	</div>

	<!-- Cover Image - Compact -->
	<div class="form-control">
		<label class="label" for={coverInputId}>
			<span class="label-text font-semibold">Cover Image</span>
			<span class="label-text-alt text-xs text-base-content/50">Optional</span>
		</label>
		{#if hasCover}
			<div class="relative overflow-hidden rounded-xl border border-base-300">
				<img src={coverPreview} alt="Story cover" class="h-32 w-full object-cover" />
				<Button
					onclick={removeCover}
					style="ghost"
					color="error"
					size="sm"
					type="button"
					class="absolute top-2 right-2"
				>
					<Trash2 class="size-3" />
				</Button>
			</div>
		{:else}
			<label for={coverInputId} class="btn w-full cursor-pointer gap-2 btn-outline">
				<Upload class="size-4" />
				<span>Upload Cover</span>
				<input
					id={coverInputId}
					type="file"
					accept="image/*"
					onchange={handleCoverChange}
					class="hidden"
					{disabled}
				/>
			</label>
		{/if}
	</div>

	<!-- Description -->
	<div class="form-control">
		<label class="label" for={storyDescriptionId}>
			<span class="label-text font-semibold">Description</span>
			<span class="label-text-alt text-xs text-base-content/50">Optional</span>
		</label>
		<textarea
			rows={3}
			placeholder="Briefly describe your story..."
			bind:value={description}
			id={storyDescriptionId}
			class="textarea-bordered textarea w-full"
			{disabled}
		></textarea>
	</div>

	<!-- Bible Fields - Collapsed -->
	<details class="collapse-arrow collapse bg-base-200">
		<summary class="collapse-title font-medium">
			<span class="flex items-center space-x-2">
				<svg
					class="h-5 w-5 text-base-content/70"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				<span>Story Bible <span class="text-xs text-base-content/50">(Optional)</span></span>
			</span>
		</summary>
		<div class="collapse-content grid grid-cols-1 gap-6 md:grid-cols-2">
			<div class="form-control">
				<label class="label" for={styleId}>
					<span class="label-text font-semibold">Style References</span>
				</label>
				<textarea
					rows={4}
					placeholder={'Cinematic noir\nComing-of-age drama'}
					bind:value={styleText}
					id={styleId}
					class="textarea-bordered textarea w-full text-sm"
					style="resize: vertical"
					{disabled}
				></textarea>
			</div>

			<div class="form-control">
				<label class="label" for={worldFactsId}>
					<span class="label-text font-semibold">World Facts</span>
				</label>
				<textarea
					rows={4}
					placeholder={'Magic runs on emotions\nThe kingdom floats above the clouds'}
					bind:value={worldFactsText}
					id={worldFactsId}
					class="textarea-bordered textarea w-full text-sm"
					style="resize: vertical"
					{disabled}
				></textarea>
			</div>
		</div>
	</details>
</div>
