<script lang="ts">
	import { onMount } from 'svelte';

	type AppSettings = {
		primary_color: string;
		has_logo: boolean;
		has_background: boolean;
		logo_file_name: string | null;
		background_file_name: string | null;
	};

	let settings: AppSettings = {
		primary_color: '#343CAD',
		has_logo: false,
		has_background: false,
		logo_file_name: null,
		background_file_name: null
	};

	let saving = false;
	let saveMessage = '';
	let saveError = false;

	// Local state for uploads
	let primaryColor = '#343CAD';
	let logoFile: File | null = null;
	let backgroundFile: File | null = null;
	let logoPreview: string | null = null;
	let backgroundPreview: string | null = null;

	// Timestamp to bust cache after upload
	let cacheBust = Date.now();

	onMount(async () => {
		const res = await fetch('/api/app_settings');
		if (res.ok) {
			settings = await res.json();
			primaryColor = settings.primary_color;
		}
	});

	function handleLogoChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		logoFile = file;
		logoPreview = URL.createObjectURL(file);
	}

	function handleBackgroundChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		backgroundFile = file;
		backgroundPreview = URL.createObjectURL(file);
	}

	async function save() {
		saving = true;
		saveMessage = '';
		saveError = false;

		const formData = new FormData();
		formData.append('primary_color', primaryColor);
		if (logoFile) formData.append('logo', logoFile);
		if (backgroundFile) formData.append('background_image', backgroundFile);

		const res = await fetch('/api/app_settings', { method: 'PUT', body: formData });

		if (res.ok) {
			settings = await res.json();
			primaryColor = settings.primary_color;
			logoFile = null;
			backgroundFile = null;
			logoPreview = null;
			backgroundPreview = null;
			cacheBust = Date.now();
			saveMessage = 'Settings saved successfully.';
		} else {
			saveError = true;
			saveMessage = 'Failed to save settings.';
		}
		saving = false;
	}

	async function removeLogo() {
		const res = await fetch('/api/app_settings/logo', { method: 'DELETE' });
		if (res.ok) {
			settings = await res.json();
			logoPreview = null;
			logoFile = null;
			cacheBust = Date.now();
		}
	}

	async function removeBackground() {
		const res = await fetch('/api/app_settings/background', { method: 'DELETE' });
		if (res.ok) {
			settings = await res.json();
			backgroundPreview = null;
			backgroundFile = null;
			cacheBust = Date.now();
		}
	}
</script>

<div class="p-6 max-w-3xl mx-auto">
	<h1 class="text-3xl font-bold mb-2 text-gray-900">Settings</h1>
	<p class="text-gray-500 mb-8">Configure your application preferences.</p>

	<!-- Visual Personalisation -->
	<section class="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
		<h2 class="text-xl font-semibold text-gray-800 mb-1">Visual Personalisation</h2>
		<p class="text-sm text-gray-500 mb-6">
			Customise how the application looks — logo, background and accent colour.
		</p>

		<div class="space-y-8">
			<!-- Logo -->
			<div>
				<h3 class="text-sm font-medium text-gray-700 mb-3">Logo</h3>
				<div class="flex items-start gap-6">
					<!-- Preview -->
					<div
						class="w-24 h-24 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0"
					>
						{#if logoPreview}
							<img src={logoPreview} alt="Logo preview" class="w-full h-full object-contain" />
						{:else if settings.has_logo}
							<img
								src="/api/app_settings/logo?v={cacheBust}"
								alt="Current logo"
								class="w-full h-full object-contain"
							/>
						{:else}
							<span class="text-3xl text-gray-300">🎵</span>
						{/if}
					</div>

					<div class="flex-1">
						<label
							class="inline-block cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
						>
							{settings.has_logo || logoPreview ? 'Replace logo' : 'Upload logo'}
							<input
								type="file"
								accept="image/*"
								class="hidden"
								on:change={handleLogoChange}
							/>
						</label>
						{#if settings.has_logo && !logoPreview}
							<button
								type="button"
								on:click={removeLogo}
								class="ml-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
							>
								Remove
							</button>
						{/if}
						<p class="mt-2 text-xs text-gray-400">
							PNG, JPG, SVG or WebP. Displayed in the sidebar in place of the app name.
						</p>
						{#if logoPreview && settings.logo_file_name}
							<p class="mt-1 text-xs text-gray-500">Current: {settings.logo_file_name}</p>
						{/if}
					</div>
				</div>
			</div>

			<hr class="border-gray-100" />

			<!-- Background image -->
			<div>
				<h3 class="text-sm font-medium text-gray-700 mb-3">Background image</h3>
				<div class="flex items-start gap-6">
					<!-- Preview -->
					<div
						class="w-24 h-24 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0"
					>
						{#if backgroundPreview}
							<img
								src={backgroundPreview}
								alt="Background preview"
								class="w-full h-full object-cover"
							/>
						{:else if settings.has_background}
							<img
								src="/api/app_settings/background?v={cacheBust}"
								alt="Current background"
								class="w-full h-full object-cover"
							/>
						{:else}
							<span class="text-3xl text-gray-300">🖼️</span>
						{/if}
					</div>

					<div class="flex-1">
						<label
							class="inline-block cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
						>
							{settings.has_background || backgroundPreview ? 'Replace image' : 'Upload image'}
							<input
								type="file"
								accept="image/*"
								class="hidden"
								on:change={handleBackgroundChange}
							/>
						</label>
						{#if settings.has_background && !backgroundPreview}
							<button
								type="button"
								on:click={removeBackground}
								class="ml-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
							>
								Remove
							</button>
						{/if}
						<p class="mt-2 text-xs text-gray-400">
							PNG, JPG or WebP. Applied as background across the main content area.
						</p>
						{#if settings.background_file_name && !backgroundPreview}
							<p class="mt-1 text-xs text-gray-500">Current: {settings.background_file_name}</p>
						{/if}
					</div>
				</div>
			</div>

			<hr class="border-gray-100" />

			<!-- Accent colour -->
			<div>
				<h3 class="text-sm font-medium text-gray-700 mb-3">Accent colour</h3>
				<div class="flex items-center gap-4">
					<input
						type="color"
						bind:value={primaryColor}
						class="w-12 h-10 rounded border border-gray-300 cursor-pointer p-0.5 bg-white"
					/>
					<input
						type="text"
						bind:value={primaryColor}
						placeholder="#343CAD"
						class="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
					<!-- Live swatch -->
					<div
						class="w-10 h-10 rounded-lg border border-gray-200 shadow-inner"
						style="background-color: {primaryColor}"
					></div>
					<p class="text-xs text-gray-400">Used for the sidebar and active states.</p>
				</div>
			</div>
		</div>

		<!-- Save -->
		<div class="mt-8 flex items-center gap-4">
			<button
				type="button"
				on:click={save}
				disabled={saving}
				class="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{saving ? 'Saving…' : 'Save changes'}
			</button>
			{#if saveMessage}
				<span class="text-sm {saveError ? 'text-red-600' : 'text-green-600'}">{saveMessage}</span>
			{/if}
		</div>
	</section>
</div>
