<script lang="ts">
	import { ImagePlus, Trash2, Upload, Sparkles } from 'lucide-svelte';
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
		disabled = false,
		name = $bindable(''),
		description = $bindable(''),
		styleText = $bindable(''),
		worldFactsText = $bindable(''),
		coverFile = $bindable(null),
		coverPreview = $bindable(null),
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

<div class="space-y-6">
	<!-- Story Name - Required -->
	<div class="form-control w-full">
		<label class="label" for={storyNameId}>
			<span class="label-text font-semibold">Story Name</span>
			<span class="label-text-alt text-error">Required</span>
		</label>
		<input
			type="text"
			placeholder="My unforgettable adventure"
			bind:value={name}
			id={storyNameId}
			class="input-bordered input w-full input-primary"
			autocomplete="off"
			required
			{disabled}
		/>
	</div>

	<!-- Cover Image - Compact -->
	<div class="form-control w-full">
		<label class="label" for={coverInputId}>
			<span class="label-text font-semibold">Cover Image</span>
			<span class="label-text-alt text-base-content/50">Optional</span>
		</label>
		{#if hasCover}
			<div class="group relative overflow-hidden rounded-xl border border-base-300">
				<img
					src={coverPreview}
					alt="Story cover"
					class="h-48 w-full object-cover transition-transform group-hover:scale-105"
				/>
				<div
					class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100"
				>
					<Button
						onclick={removeCover}
						style="soft"
						color="error"
						size="sm"
						type="button"
						class="shadow-lg"
					>
						<Trash2 class="mr-2 size-4" />
						Remove Cover
					</Button>
				</div>
			</div>
		{:else}
			<label for={coverInputId} class="btn w-full gap-2 border-dashed btn-outline btn-primary">
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
	<div class="form-control w-full">
		<label class="label" for={storyDescriptionId}>
			<span class="label-text font-semibold">Description</span>
			<span class="label-text-alt text-base-content/50">Optional</span>
		</label>
		<textarea
			rows={3}
			placeholder="Briefly describe your story..."
			bind:value={description}
			id={storyDescriptionId}
			class="textarea-bordered textarea w-full textarea-primary"
			{disabled}
		></textarea>
	</div>

	<!-- Bible Fields - Collapsed -->
	<div class="collapse-arrow collapse rounded-box border border-base-300 bg-base-100">
		<input type="checkbox" />
		<div class="collapse-title flex items-center gap-2 font-medium">
			<Sparkles class="size-4 text-primary" />
			Story Bible
			<span class="ml-auto text-xs font-normal text-base-content/50">Optional</span>
		</div>
		<div class="collapse-content space-y-4">
			<div class="form-control w-full pt-2">
				<label class="label" for={styleId}>
					<span class="label-text font-semibold">Style References</span>
				</label>
				<textarea
					rows={3}
					placeholder={'Cinematic noir\nComing-of-age drama'}
					bind:value={styleText}
					id={styleId}
					class="textarea-bordered textarea w-full text-sm"
					style="resize: vertical"
					{disabled}
				></textarea>
			</div>

			<div class="form-control w-full">
				<label class="label" for={worldFactsId}>
					<span class="label-text font-semibold">World Facts</span>
				</label>
				<textarea
					rows={3}
					placeholder={'Magic runs on emotions\nThe kingdom floats above the clouds'}
					bind:value={worldFactsText}
					id={worldFactsId}
					class="textarea-bordered textarea w-full text-sm"
					style="resize: vertical"
					{disabled}
				></textarea>
			</div>
		</div>
	</div>
</div>
