<script lang="ts">
	import { onMount } from 'svelte';

	type Setting = {
		id: number;
		variable: string;
		value: string;
	};

	let settings: Setting[] = [];

	let backupEnabled = false;
	let backupFrequency = 'weekly';
	let backupEmail = '';
	let lastBackupSent = '';

	let loading = false;
	let message = '';

	onMount(async () => {
		await loadSettings();
	});

	function getSettingValue(name: string, fallback = '') {
		return settings.find((setting) => setting.variable === name)?.value ?? fallback;
	}

	async function loadSettings() {
		const response = await fetch('/api/settings');

		if (response.ok) {
			settings = await response.json();

			backupEnabled = getSettingValue('backup_enabled', 'false') === 'true';
			backupFrequency = getSettingValue('backup_frequency', 'weekly');
			backupEmail = getSettingValue('backup_email', '');
			lastBackupSent = getSettingValue('backup_last_sent', '');
		}
	}

	async function saveSetting(variable: string, value: string) {
		await fetch('/api/settings', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ variable, value })
		});
	}

	async function saveBackupSettings() {
		loading = true;
		message = '';

		await saveSetting('backup_enabled', String(backupEnabled));
		await saveSetting('backup_frequency', backupFrequency);
		await saveSetting('backup_email', backupEmail);

		loading = false;
		message = 'Settings saved successfully.';
	}

	async function sendBackupNow() {
		loading = true;
		message = '';

		const response = await fetch('/api/settings/backup/now', {
			method: 'POST'
		});

		if (response.ok) {
			message = 'Backup sent successfully.';
			await loadSettings();
		} else {
			message = 'Backup failed.';
		}

		loading = false;
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

<div class="p-6 max-w-5xl mx-auto">
	<h1 class="text-3xl font-bold mb-8 text-center">Settings</h1>

	<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
		<h2 class="text-2xl font-semibold mb-6 text-gray-800">Regular database backups</h2>

		<div class="space-y-5">
			<label class="flex items-center gap-3">
				<input type="checkbox" checked={backupEnabled} class="w-5 h-5" on:change={handleBackupToggle} />
				<span class="text-gray-700 font-medium">Enable automatic backups</span>
			</label>

			<div>
				<label for="backupFrequency" class="block text-sm font-medium text-gray-700 mb-1">
					Backup frequency
				</label>
				<select
					id="backupFrequency"
					bind:value={backupFrequency}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
					placeholder="admin@example.com"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg"
				/>
			</div>

			<div class="text-sm text-gray-600">
				Last backup sent:
				<span class="font-medium">
					{lastBackupSent ? new Date(lastBackupSent).toLocaleString() : 'Never'}
				</span>
			</div>

			<div class="flex gap-3">
				<button
					type="button"
					on:click={saveBackupSettings}
					disabled={loading}
					class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
				>
					Save settings
				</button>

				<button
					type="button"
					on:click={sendBackupNow}
					disabled={loading}
					class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
				>
					Send backup now
				</button>
			</div>

			{#if message}
				<p class="text-sm text-gray-700">{message}</p>
			{/if}
		</div>
	</div>
</div>