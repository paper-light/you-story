<script lang="ts">
	import {
		Sparkles,
		ArrowRight,
		Ghost,
		Crown,
		HeartHandshake,
		Wand2,
		Fingerprint
	} from 'lucide-svelte';
</script>

<div class="min-h-screen bg-base-100 overflow-x-hidden selection:bg-primary selection:text-primary-content">
	<!-- Hero Section -->
	<section class="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
		<!-- Dynamic Background -->
		<div class="absolute inset-0 z-0">
			<div class="absolute inset-0 bg-base-100"></div>
			<div class="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
			<div class="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[100px] animate-pulse-slower"></div>
			<!-- Grid Pattern Overlay -->
			<div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50"></div>
		</div>

		<div class="container relative z-10 mx-auto px-6 pt-20 pb-32 text-center">
			<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-base-200/50 backdrop-blur-md border border-base-content/5 mb-8 animate-fade-in-up">
				<Sparkles class="w-4 h-4 text-primary" />
				<span class="text-sm font-medium text-base-content/80">Experience the Impossible</span>
			</div>

			<h1 class="max-w-5xl mx-auto text-6xl md:text-8xl font-black tracking-tight leading-tight mb-8 animate-fade-in-up delay-100">
				Live the <span class="text-transparent bg-clip-text bg-linear-to-r from-primary via-secondary to-accent">Unlived</span>
			</h1>

			<p class="max-w-2xl mx-auto text-xl md:text-2xl text-base-content/70 leading-relaxed mb-12 animate-fade-in-up delay-200">
				Step into a reality where you make the rules. Explore fantasies, connections, and adventures that exist only in your wildest dreams.
			</p>

			<div class="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up delay-300">
				<a href="/app/auth" class="group relative px-8 py-4 bg-primary text-primary-content font-bold text-lg rounded-2xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_var(--color-primary)]">
					<div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
					<span class="relative flex items-center gap-2">
						Start Your Story
						<ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
					</span>
				</a>
				<a href="#features" class="text-base-content/70 hover:text-base-content font-medium transition-colors">
					Explore Features
				</a>
			</div>
		</div>

		<!-- Floating UI Elements (Decorative) -->
		<div class="absolute top-1/4 left-10 hidden lg:block animate-float-slow">
			<div class="glass-card p-4 rounded-2xl flex items-center gap-4 max-w-xs">
				<div class="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
					<HeartHandshake class="w-5 h-5 text-accent" />
				</div>
				<div>
					<div class="text-xs text-base-content/50">Current Status</div>
					<div class="text-sm font-bold">Deeply Connected</div>
				</div>
			</div>
		</div>

		<div class="absolute bottom-1/4 right-10 hidden lg:block animate-float-slower">
			<div class="glass-card p-4 rounded-2xl flex items-center gap-4 max-w-xs">
				<div class="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
					<Crown class="w-5 h-5 text-secondary" />
				</div>
				<div>
					<div class="text-xs text-base-content/50">Achievement</div>
					<div class="text-sm font-bold">Ruler of Worlds</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Value Proposition Section -->
	<section id="features" class="py-32 relative">
		<div class="container mx-auto px-6">
			<div class="grid md:grid-cols-3 gap-12">
				<!-- Feature 1 -->
				<div class="group p-8 rounded-3xl bg-base-200/30 hover:bg-base-200/50 border border-base-content/5 transition-all hover:-translate-y-2 duration-300">
					<div class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
						<Ghost class="w-7 h-7 text-primary" />
					</div>
					<h3 class="text-2xl font-bold mb-4">No Judgment</h3>
					<p class="text-base-content/70 leading-relaxed">
						Your private world. Express your deepest desires and explore scenarios you'd never dare in reality. Total freedom, zero consequences.
					</p>
				</div>

				<!-- Feature 2 -->
				<div class="group p-8 rounded-3xl bg-base-200/30 hover:bg-base-200/50 border border-base-content/5 transition-all hover:-translate-y-2 duration-300 delay-100">
					<div class="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
						<Wand2 class="w-7 h-7 text-secondary" />
					</div>
					<h3 class="text-2xl font-bold mb-4">Infinite Possibilities</h3>
					<p class="text-base-content/70 leading-relaxed">
						From medieval kingdoms to cyberpunk cities. Be a hero, a villain, or a lover. The only limit is your imagination.
					</p>
				</div>

				<!-- Feature 3 -->
				<div class="group p-8 rounded-3xl bg-base-200/30 hover:bg-base-200/50 border border-base-content/5 transition-all hover:-translate-y-2 duration-300 delay-200">
					<div class="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
						<Fingerprint class="w-7 h-7 text-accent" />
					</div>
					<h3 class="text-2xl font-bold mb-4">Uniquely Yours</h3>
					<p class="text-base-content/70 leading-relaxed">
						AI that learns your style and preferences. Every interaction is tailored to you, creating a bond that feels genuinely real.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Immersion/How it works Section -->
	<section class="py-32 bg-base-200/50 relative overflow-hidden">
		<!-- Decorative Blur -->
		<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-[150px]"></div>

		<div class="container relative z-10 mx-auto px-6">
			<div class="max-w-4xl mx-auto text-center mb-20">
				<h2 class="text-4xl md:text-6xl font-bold mb-6">How Your World Comes Alive</h2>
				<p class="text-xl text-base-content/70">Three simple steps to escape reality.</p>
			</div>

			<div class="grid md:grid-cols-3 gap-8 relative">
				<!-- Connecting Line (Desktop) -->
				<div class="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-linear-to-r from-transparent via-base-content/10 to-transparent"></div>

				<!-- Step 1 -->
				<div class="relative text-center">
					<div class="w-24 h-24 mx-auto bg-base-100 rounded-full border-4 border-base-200 flex items-center justify-center mb-6 relative z-10 shadow-xl">
						<span class="text-3xl font-black text-primary">1</span>
					</div>
					<h3 class="text-xl font-bold mb-2">Choose a Persona</h3>
					<p class="text-base-content/60">Pick who you want to be and who you want to meet.</p>
				</div>

				<!-- Step 2 -->
				<div class="relative text-center">
					<div class="w-24 h-24 mx-auto bg-base-100 rounded-full border-4 border-base-200 flex items-center justify-center mb-6 relative z-10 shadow-xl">
						<span class="text-3xl font-black text-secondary">2</span>
					</div>
					<h3 class="text-xl font-bold mb-2">Set the Scene</h3>
					<p class="text-base-content/60">Define the world, the mood, and the stakes.</p>
				</div>

				<!-- Step 3 -->
				<div class="relative text-center">
					<div class="w-24 h-24 mx-auto bg-base-100 rounded-full border-4 border-base-200 flex items-center justify-center mb-6 relative z-10 shadow-xl">
						<span class="text-3xl font-black text-accent">3</span>
					</div>
					<h3 class="text-xl font-bold mb-2">Live the Moment</h3>
					<p class="text-base-content/60">Dive in. The story reacts to your every move.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="py-32 relative overflow-hidden">
		<div class="absolute inset-0 bg-linear-to-br from-primary/20 via-base-100 to-secondary/20 opacity-50"></div>
		
		<div class="container relative z-10 mx-auto px-6 text-center">
			<h2 class="text-5xl md:text-7xl font-black mb-8 tracking-tight">
				Your Story Begins <span class="text-primary">Now</span>
			</h2>
			<p class="text-xl md:text-2xl text-base-content/70 mb-12 max-w-2xl mx-auto">
				Don't just read about adventures. Live them.
			</p>
			<a href="/app/auth" class="btn btn-primary btn-lg px-12 text-xl rounded-2xl h-16 shadow-[0_0_30px_-5px_var(--color-primary)] hover:shadow-[0_0_50px_-5px_var(--color-primary)] hover:scale-105 transition-all duration-300 border-none">
				Enter the Portal
			</a>
		</div>
	</section>
</div>

<style>
	.glass-card {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.animate-pulse-slow {
		animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	.animate-pulse-slower {
		animation: pulse 12s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	.animate-float-slow {
		animation: float 6s ease-in-out infinite;
	}

	.animate-float-slower {
		animation: float 8s ease-in-out infinite reverse;
	}

	.animate-fade-in-up {
		animation: fadeInUp 0.8s ease-out forwards;
		opacity: 0;
		transform: translateY(20px);
	}

	.delay-100 { animation-delay: 100ms; }
	.delay-200 { animation-delay: 200ms; }
	.delay-300 { animation-delay: 300ms; }

	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-20px); }
	}

	@keyframes fadeInUp {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
