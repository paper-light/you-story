<script lang="ts">
	import { Upload, X } from 'lucide-svelte';
	import type { CharactersResponse } from '$lib';
	import { chatsStore, pb } from '$lib';
	import { charactersStore } from '../characters.svelte';
	import { Button } from '$lib/shared/ui';
	import pchelImage from '$lib/shared/assets/images/pchel.png';
	import { userStore } from '$lib/apps/user/client';
	import { charactersApi } from '../charactersApi';

	interface Props {
		character?: CharactersResponse | null;
		open?: boolean;
		onclose?: () => void;
		modal?: boolean;
	}

	const user = $derived(userStore.user);

	let {
		character = $bindable(null),
		open = $bindable(false),
		onclose,
		modal = true
	}: Props = $props();

	const chat = $derived(chatsStore.chats.find((c) => c.friend === character?.id));

	let isCreating = $derived(character === null);
	// Form state
	let formName = $derived(character?.name ?? '');
	let formDescription = $derived(character?.description ?? '');
	let formAge = $derived(character?.age ?? undefined);
	let formAvatarFile: File | null = $derived(null);
	let formAvatarPreview: string | null = $derived(getAvatarUrl(character) ?? null);

	let originalCharacter: CharactersResponse | null = $state(character ?? null);

	let isSaving = $state(false);

	function getAvatarUrl(char: CharactersResponse | null): string | null {
		if (!char?.avatar) return null;
		return pb?.files.getURL(char, char.avatar) || null;
	}

	function getAvatarFallback(char: CharactersResponse | null): string {
		if (formAvatarPreview) return formAvatarPreview;
		if (char) {
			const url = getAvatarUrl(char);
			if (url) return url;
		}
		return pchelImage;
	}

	function closeModal() {
		open = false;
		character = null;
		originalCharacter = null;
		formName = '';
		formDescription = '';
		formAge = undefined;
		formAvatarFile = null;
		formAvatarPreview = null;
		onclose?.();
	}

	async function handleSave() {
		if (isSaving) return;
		isSaving = true;

		try {
			const data: {
				name?: string;
				description?: string;
				age?: number;
				avatar?: File;
				user?: string;
			} = {};

			if (formName.trim()) data.name = formName.trim();
			if (formDescription.trim()) data.description = formDescription.trim();
			if (formAge !== undefined) data.age = formAge;
			if (formAvatarFile) data.avatar = formAvatarFile;
			if (user?.id) data.user = user.id;

			if (isCreating) {
				charactersStore.addOptimisticCharacter(data);
				await charactersApi.create(data);
			} else if (character) {
				await charactersApi.update(character.id, data);
			}

			if (modal) closeModal();
		} catch (error) {
			console.error('Error saving character:', error);
		} finally {
			isSaving = false;
		}
	}

	function handleAvatarChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			formAvatarFile = file;
			const reader = new FileReader();
			reader.onload = (e) => {
				formAvatarPreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function removeAvatar() {
		formAvatarFile = null;
		formAvatarPreview = null;
	}
</script>

<div class="flex h-full flex-col">
	<!-- Header -->
	<header
		class="mb-6 flex shrink-0 items-center justify-between border-b border-base-300 pr-6 pb-4"
	>
		<div>
			<h2 class="text-2xl font-bold">{isCreating ? 'Create Character' : 'Edit Character'}</h2>
			<p class="mt-1 text-sm text-base-content/60">
				{isCreating ? 'Add a new character to your collection' : 'Update character information'}
			</p>
		</div>

		{#if !isCreating && chat && character}
			<Button
				wide
				href={`/app/characters/${character.id}/chats/${chat.id}`}
				color="primary"
				style="soft"
				disabled={isSaving}>Go to Chat</Button
			>
		{/if}
	</header>

	<!-- Form Content -->
	<div class="min-h-0 flex-1 space-y-6 overflow-y-auto">
		<!-- Avatar Section -->
		<div class="card bg-base-200">
			<div class="card-body">
				<div class="label pb-2">
					<span class="label-text font-semibold">Avatar</span>
				</div>
				<div class="flex flex-col items-center gap-4 sm:flex-row">
					<!-- Avatar Preview -->
					<div class="group avatar relative">
						<div class="w-32 rounded-2xl ring-4 ring-primary ring-offset-2 ring-offset-base-100">
							<img src={getAvatarFallback(character)} alt="Character avatar" />
						</div>
						{#if formAvatarPreview || getAvatarUrl(character)}
							<button
								onclick={removeAvatar}
								class="btn absolute -top-2 -right-2 btn-circle opacity-0 transition-opacity btn-sm btn-error group-hover:opacity-100"
								title="Remove avatar"
							>
								<X class="size-4" />
							</button>
						{/if}
					</div>

					<!-- File Input -->
					<div class="flex-1">
						<label
							for="avatar-input"
							class="btn w-full cursor-pointer gap-2 btn-outline btn-primary"
						>
							<Upload class="size-4" />
							<span>{formAvatarFile ? 'Change Avatar' : 'Upload Avatar'}</span>
						</label>
						<input
							type="file"
							id="avatar-input"
							accept="image/*"
							onchange={handleAvatarChange}
							class="hidden"
						/>
						<p class="mt-2 text-xs text-base-content/50">
							Recommended: Square image, at least 256x256 pixels
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Basic Information -->
		<div class="card bg-base-200">
			<div class="card-body space-y-4">
				<h3 class="mb-2 text-lg font-semibold">Basic Information</h3>

				<!-- Name -->
				<div class="form-control">
					<label class="label pb-2" for="name-input">
						<span class="label-text font-medium">Name</span>
						<span class="label-text-alt text-error">*</span>
					</label>
					<input
						type="text"
						id="name-input"
						bind:value={formName}
						placeholder="Enter character name"
						class="input-bordered input w-full input-primary"
					/>
				</div>

				<!-- Age -->
				<div class="form-control">
					<label class="label pb-2" for="age-input">
						<span class="label-text font-medium">Age</span>
					</label>
					<input
						type="number"
						id="age-input"
						bind:value={formAge}
						placeholder="Enter age (optional)"
						min="0"
						class="input-bordered input w-full input-primary"
					/>
				</div>
			</div>
		</div>

		<!-- Description -->
		<div class="card bg-base-200">
			<div class="card-body">
				<label class="label pb-2" for="description-input">
					<span class="label-text font-semibold">Description</span>
				</label>
				<textarea
					id="description-input"
					bind:value={formDescription}
					placeholder="Write a detailed description of your character..."
					class="textarea-bordered textarea h-32 w-full resize-none textarea-primary"
				></textarea>
				<p class="mt-2 text-xs text-base-content/50">
					Tell us about your character's personality, background, or any other details.
				</p>
			</div>
		</div>
	</div>

	<!-- Footer Actions -->
	<div class="mt-6 flex shrink-0 justify-end gap-3 border-t border-base-300 pt-4">
		{#if modal}
			<Button onclick={closeModal} color="neutral" style="ghost" disabled={isSaving}>Close</Button>
		{/if}
		<Button onclick={handleSave} color="primary" disabled={isSaving}>
			{#if isSaving}
				<span class="loading loading-sm loading-spinner"></span>
				Saving...
			{:else}
				Save
			{/if}
		</Button>
	</div>
</div>
