<script lang="ts">
	import { Menu, Heart } from 'lucide-svelte';
	import ThemeController from '$lib/shared/ui/ThemeController.svelte';

	let { children } = $props();
</script>

<div class="drawer drawer-end">
	<input id="mobile-drawer" type="checkbox" class="drawer-toggle" />

	<!-- Main Content -->
	<div class="drawer-content flex min-h-screen flex-col">
		<!-- Transparent Header -->
		<header class="fixed top-0 z-50 w-full">
			<div class="absolute inset-0 bg-base-100/80 backdrop-blur-md"></div>
			<nav class="relative container mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 items-center justify-between">
					<!-- Logo -->
					<a href="/" class="flex items-center gap-2 text-lg font-bold text-base-content">
						<Heart class="size-8 text-primary" />
						<span>YouStory</span>
					</a>

					<!-- Desktop Navigation -->
					<div class="hidden md:flex md:items-center md:gap-6">
						<div class="flex items-center gap-3">
							<ThemeController />
							<a href="/app/auth" class="btn btn-primary"> Get Started Free </a>
						</div>
					</div>

					<!-- Mobile Menu Button -->
					<label
						for="mobile-drawer"
						class="drawer-button btn p-2 text-base-content btn-ghost md:hidden"
						aria-label="Toggle menu"
					>
						<Menu class="h-6 w-6" />
					</label>
				</div>
			</nav>
		</header>

		<!-- Main Content -->
		<main class="flex-1 pt-16">
			{@render children()}
		</main>

		<!-- Footer -->
		<footer class="footer bg-base-200 p-10 text-base-content md:footer-horizontal">
			<!-- <nav>
				<h6 class="footer-title">Navigation</h6>
				<a href="#features" class="link link-hover">Features</a>
				<a href="#privacy" class="link link-hover">Privacy</a>
				<a href="/app/auth" class="link link-hover">Sign In</a>
			</nav> -->
			<nav>
				<h6 class="footer-title">Legal</h6>
				<a href="/legal/terms-and-conditions" class="link link-hover">Terms & Conditions</a>
				<a href="/legal/privacy-policy" class="link link-hover">Privacy Policy</a>
			</nav>
			<aside>
				<h6 class="footer-title">YouStory</h6>
				<p class="text-base-content/70">© 2025 YouStory. All rights reserved.</p>
			</aside>
		</footer>
	</div>

	<!-- Mobile Sidebar -->
	<div class="drawer-side">
		<label for="mobile-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
		<aside class="min-h-full w-80 bg-base-200 p-4">
			<div class="mb-6 flex items-center gap-2 border-b border-base-300 pb-4">
				<Heart class="h-6 w-6 text-primary" />
				<span class="text-lg font-bold text-base-content">YouStory</span>
			</div>

			<nav class="flex flex-col gap-4">
				<!-- <a href="#features" class="link text-base-content link-hover">Features</a>
				<a href="#privacy" class="link text-base-content link-hover">Privacy</a>
				<a href="/app/auth" class="link text-base-content link-hover">Sign In</a>

				<div class="divider my-2"></div> -->

				<div class="flex flex-col gap-4">
					<ThemeController expanded={true} />
					<a href="/app/auth" class="btn w-full btn-primary"> Get Started </a>
				</div>

				<div class="divider my-2"></div>

				<div class="flex flex-col gap-2 text-sm">
					<a href="/legal/terms-and-conditions" class="link text-base-content/70 link-hover">
						Terms
					</a>
					<a href="/legal/privacy-policy" class="link text-base-content/70 link-hover">
						Privacy Policy
					</a>
				</div>
			</nav>
		</aside>
	</div>
</div>
