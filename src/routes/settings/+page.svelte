<script lang="ts">
	import { onMount } from 'svelte';

	type AppSettings = {
		primary_color: string;
		has_logo: boolean;
		has_background: boolean;
		logo_file_name: string | null;
		background_file_name: string | null;
	};

	type Setting = {
		id: number;
		variable: string;
		value: string;
	};

	const IMAGE_ACCEPT = 'image/png,image/jpeg,image/gif,image/webp,image/avif';
	const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'];
	const IMAGE_MAX_SIZE_BYTES = 2 * 1024 * 1024;

	function validateImage(file: File): string | null {
		const ext = file.name.split('.').pop()?.toLowerCase();

		if (!ext || !IMAGE_EXTENSIONS.includes(ext)) {
			return 'Unsupported file type. Please use PNG, JPG, GIF, WebP or AVIF.';
		}

		if (file.size > IMAGE_MAX_SIZE_BYTES) {
			return 'File is too large. Maximum size is 2MB.';
		}

		return null;
	}

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

	let primaryColor = '#343CAD';
	let logoFile: File | null = null;
	let backgroundFile: File | null = null;
	let logoPreview: string | null = null;
	let backgroundPreview: string | null = null;

	let cacheBust = Date.now();

	let backupSettings: Setting[] = [];

	let backupEnabled = false;
	let backupFrequency = 'weekly';
	let backupEmail = '';
	let lastBackupSent = '';

	let backupLoading = false;
	let backupMessage = '';
	let backupError = false;

	onMount(async () => {
		const res = await fetch('/api/app_settings');

		if (res.ok) {
			settings = await res.json();
			primaryColor = settings.primary_color;
		}

		await loadBackupSettings();
	});

	function handleLogoChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		const error = validateImage(file);

		if (error) {
			saveError = true;
			saveMessage = error;
			input.value = '';
			return;
		}

		saveMessage = '';
		saveError = false;
		logoFile = file;
		logoPreview = URL.createObjectURL(file);
	}

	function handleBackgroundChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		const error = validateImage(file);

		if (error) {
			saveError = true;
			saveMessage = error;
			input.value = '';
			return;
		}

		saveMessage = '';
		saveError = false;
		backgroundFile = file;
		backgroundPreview = URL.createObjectURL(file);
	}

	async function save() {
		saving = true;
		saveMessage = '';
		saveError = false;

		const formData = new FormData();

		formData.append('primary_color', primaryColor);

		if (logoFile) {
			formData.append('logo', logoFile);
		}

		if (backgroundFile) {
			formData.append('background_image', backgroundFile);
		}

		const res = await fetch('/api/app_settings', {
			method: 'PUT',
			body: formData
		});

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
		const res = await fetch('/api/app_settings/logo', {
			method: 'DELETE'
		});

		if (res.ok) {
			settings = await res.json();
			logoPreview = null;
			logoFile = null;
			cacheBust = Date.now();
		}
	}

	async function removeBackground() {
		const res = await fetch('/api/app_settings/background', {
			method: 'DELETE'
		});

		if (res.ok) {
			settings = await res.json();
			backgroundPreview = null;
			backgroundFile = null;
			cacheBust = Date.now();
		}
	}

	function getBackupSettingValue(name: string, fallback = '') {
		return backupSettings.find((setting) => setting.variable === name)?.value ?? fallback;
	}

	async function loadBackupSettings() {
		const response = await fetch('/api/settings');

		if (response.ok) {
			backupSettings = await response.json();

			backupEnabled = getBackupSettingValue('backup_enabled', 'false') === 'true';
			backupFrequency = getBackupSettingValue('backup_frequency', 'weekly');
			backupEmail = getBackupSettingValue('backup_email', '');
			lastBackupSent = getBackupSettingValue('backup_last_sent', '');
		}
	}

	async function saveBackupSetting(variable: string, value: string) {
		const response = await fetch('/api/settings', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				variable,
				value
			})
		});

		if (!response.ok) {
			throw new Error(`Failed to save ${variable}`);
		}
	}

	async function saveBackupSettings() {
		backupLoading = true;
		backupMessage = '';
		backupError = false;

		try {
			await saveBackupSetting('backup_enabled', String(backupEnabled));
			await saveBackupSetting('backup_frequency', backupFrequency);
			await saveBackupSetting('backup_email', backupEmail);

			backupMessage = 'Backup settings saved successfully.';
		} catch {
			backupError = true;
			backupMessage = 'Failed to save backup settings.';
		} finally {
			backupLoading = false;
		}
	}

	async function sendBackupNow() {
		backupLoading = true;
		backupMessage = '';
		backupError = false;

		try {
			const response = await fetch('/api/settings/backup/now', {
				method: 'POST'
			});

			if (!response.ok) {
				throw new Error('Backup failed');
			}

			backupMessage = 'Backup sent successfully.';
			await loadBackupSettings();
		} catch {
			backupError = true;
			backupMessage = 'Backup failed.';
		} finally {
			backupLoading = false;
		}
	}

	function handleBackupToggle(event: Event) {
		const checkbox = event.target as HTMLInputElement;

		if (!checkbox.checked) {
			const confirmDisable = confirm(
				'Are you sure you want to disable automatic database backups? Backups are important for data security.'
			);

			if (!confirmDisable) {
				checkbox.checked = true;
				backupEnabled = true;
				return;
			}
		}

		backupEnabled = checkbox.checked;
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
					<div
						class="w-24 h-24 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0"
					>
						{#if logoPreview}
							<img
								src={logoPreview}
								alt="Logo preview"
								class="w-full h-full object-contain"
							/>
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
								accept={IMAGE_ACCEPT}
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
							PNG, JPG, GIF, WebP or AVIF, up to 2MB. Displayed in the sidebar in
							place of the app name.
						</p>

						{#if logoPreview && settings.logo_file_name}
							<p class="mt-1 text-xs text-gray-500">
								Current: {settings.logo_file_name}
							</p>
						{/if}
					</div>
				</div>
			</div>

			<hr class="border-gray-100" />

			<!-- Background image -->
			<div>
				<h3 class="text-sm font-medium text-gray-700 mb-3">Background image</h3>

				<div class="flex items-start gap-6">
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
							{settings.has_background || backgroundPreview
								? 'Replace image'
								: 'Upload image'}

							<input
								type="file"
								accept={IMAGE_ACCEPT}
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
							PNG, JPG, GIF, WebP or AVIF, up to 2MB. Applied as background across
							the main content area.
						</p>

						{#if settings.background_file_name && !backgroundPreview}
							<p class="mt-1 text-xs text-gray-500">
								Current: {settings.background_file_name}
							</p>
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

					<div
						class="w-10 h-10 rounded-lg border border-gray-200 shadow-inner"
						style="background-color: {primaryColor}"
					></div>

					<p class="text-xs text-gray-400">Used for the sidebar and active states.</p>
				</div>
			</div>
		</div>

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
				<span class="text-sm {saveError ? 'text-red-600' : 'text-green-600'}">
					{saveMessage}
				</span>
			{/if}
		</div>
	</section>

	<!-- Database backups -->
	<section class="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
		<h2 class="text-xl font-semibold text-gray-800 mb-1">Regular database backups</h2>

		<p class="text-sm text-gray-500 mb-6">
			Configure automatic database backups and send a backup manually when needed.
		</p>

		<div class="space-y-5">
			<label class="flex items-center gap-3">
				<input
					type="checkbox"
					checked={backupEnabled}
					disabled={backupLoading}
					class="w-5 h-5"
					on:change={handleBackupToggle}
				/>

				<span class="text-gray-700 font-medium">Enable automatic backups</span>
			</label>

			<div>
				<label
					for="backupFrequency"
					class="block text-sm font-medium text-gray-700 mb-1"
				>
					Backup frequency
				</label>

				<select
					id="backupFrequency"
					bind:value={backupFrequency}
					disabled={!backupEnabled || backupLoading}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
				>
					<option value="daily">Daily</option>
					<option value="weekly">Weekly</option>
					<option value="monthly">Monthly</option>
				</select>
			</div>

			<div>
				<label for="backupEmail" class="block text-sm font-medium text-gray-700 mb-1">
					Backup email address
				</label>

				<input
					id="backupEmail"
					type="email"
					bind:value={backupEmail}
					disabled={!backupEnabled || backupLoading}
					placeholder="admin@example.com"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
				/>
			</div>

			<div class="text-sm text-gray-600">
				Last backup sent:

				<span class="font-medium">
					{lastBackupSent ? new Date(lastBackupSent).toLocaleString() : 'Never'}
				</span>
			</div>

			<div class="flex flex-wrap gap-3">
				<button
					type="button"
					on:click={saveBackupSettings}
					disabled={backupLoading}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{backupLoading ? 'Processing…' : 'Save backup settings'}
				</button>

				<button
					type="button"
					on:click={sendBackupNow}
					disabled={backupLoading}
					class="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					Send backup now
				</button>
			</div>

			{#if backupMessage}
				<p class="text-sm {backupError ? 'text-red-600' : 'text-green-600'}">
					{backupMessage}
				</p>
			{/if}
		</div>
	</section>
</div>