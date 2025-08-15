<!-- src/lib/components/recruitment/RecruitmentSettings.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { X, Settings, Info } from 'lucide-svelte'
	import type { RecruitmentSettings as SettingsType } from '$lib/types'

	export let projectId: string
	export let settings: SettingsType

	const dispatch = createEventDispatcher()

	let localSettings = {
		follow_up_days: settings?.follow_up_days || 7,
		auto_follow_up_enabled: settings?.auto_follow_up_enabled || true
	}

	$: if (settings) {
		localSettings = {
			follow_up_days: settings.follow_up_days || 7,
			auto_follow_up_enabled: settings.auto_follow_up_enabled || true
		}
	}

	let saving = false

	async function saveSettings() {
		if (!projectId || projectId === 'undefined') {
			console.error('Invalid project ID for settings save')
			alert('Error: Invalid project ID')
			return
		}

		saving = true

		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/settings`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(localSettings)
			})

			if (response.ok) {
				const updatedSettings = await response.json()
				dispatch('update', updatedSettings)
				dispatch('close')
			} else {
				const errorData = await response.json()
				console.error('Settings save failed:', errorData)
				alert(`Error saving: ${errorData.error || 'Unknown error'}`)
			}
		} catch (error) {
			console.error('Error saving settings:', error)
			alert('Error saving settings')
		} finally {
			saving = false
		}
	}

	function closeModal() {
		dispatch('close')
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal()
		}
	}

	function validateFollowUpDays(value: number) {
		if (value < 1) {
			localSettings.follow_up_days = 1
		} else if (value > 30) {
			localSettings.follow_up_days = 30
		}
	}

	$: validateFollowUpDays(localSettings.follow_up_days)
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	<div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
		<!-- Header -->
		<div class="flex items-center justify-between p-6 border-b">
			<div class="flex items-center gap-2">
				<Settings class="text-[#6B9AD9]" size={24} />
				<h2 class="text-xl font-semibold">Recruitment Settings</h2>
			</div>
			<button
				on:click={closeModal}
				class="text-gray-400 hover:text-gray-600 transition-colors"
				aria-label="Close"
			>
				<X size={24} />
			</button>
		</div>

		<!-- Content -->
		<div class="p-6 space-y-6">
			<!-- Automatic follow-up -->
			<div class="space-y-4">
				<div class="flex items-center gap-2">
					<h3 class="text-lg font-semibold">Automatic Follow-up</h3>
					<Info size={16} class="text-gray-400" title="Automatic contact follow-up configuration" />
				</div>

				<div class="space-y-4">
					<!-- Enable automatic follow-up -->
					<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
						<div>
							<label for="auto-follow-up" class="font-medium text-gray-900 cursor-pointer">
								Enable automatic follow-up
							</label>
							<p class="text-sm text-gray-600 mt-1">
								Contacts in "awaiting response" will automatically change to "follow up" after the configured delay
							</p>
						</div>
						<label class="relative inline-flex items-center cursor-pointer">
							<input
								id="auto-follow-up"
								type="checkbox"
								bind:checked={localSettings.auto_follow_up_enabled}
								class="sr-only peer"
							/>
							<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
						</label>
					</div>

					<!-- Follow-up delay -->
					<div class="space-y-2">
						<label for="follow-up-days" class="block font-medium text-gray-900">
							Follow-up delay (in days)
						</label>
						<div class="flex items-center gap-4">
							<input
								id="follow-up-days"
								type="number"
								min="1"
								max="30"
								bind:value={localSettings.follow_up_days}
								disabled={!localSettings.auto_follow_up_enabled}
								class="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
							/>
							<span class="text-sm text-gray-600">
								day(s) after first contact
							</span>
						</div>
						<p class="text-sm text-gray-500">
							If a contact is "awaiting response" for {localSettings.follow_up_days || 7} day(s),
							it will automatically change to "follow up"
						</p>
					</div>
				</div>
			</div>

			<!-- Impact information -->
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div class="flex items-start gap-2">
					<Info size={16} class="text-blue-500 mt-0.5 flex-shrink-0" />
					<div class="text-sm">
						<p class="font-medium text-blue-900 mb-1">Impact of changes</p>
						<p class="text-blue-800">
							Modifying the follow-up delay will automatically recalculate the status of all contacts
							currently "awaiting response" based on their initial contact date.
						</p>
					</div>
				</div>
			</div>

			<!-- Current statistics -->
			<div class="bg-gray-50 rounded-lg p-4">
				<h4 class="font-medium text-gray-900 mb-2">Current settings overview</h4>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span class="text-gray-600">Automatic follow-up:</span>
						<span class="font-medium {(settings?.auto_follow_up_enabled || false) ? 'text-green-600' : 'text-red-600'}">
							{(settings?.auto_follow_up_enabled || false) ? 'Enabled' : 'Disabled'}
						</span>
					</div>
					<div>
						<span class="text-gray-600">Current delay:</span>
						<span class="font-medium">{settings?.follow_up_days || 7} day(s)</span>
					</div>
				</div>
			</div>

			<!-- Changes preview -->
			{#if settings && (localSettings.follow_up_days !== settings.follow_up_days || localSettings.auto_follow_up_enabled !== settings.auto_follow_up_enabled)}
				<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<div class="flex items-start gap-2">
						<Info size={16} class="text-yellow-500 mt-0.5 flex-shrink-0" />
						<div class="text-sm">
							<p class="font-medium text-yellow-900 mb-1">Pending changes</p>
							<div class="space-y-1 text-yellow-800">
								{#if localSettings.follow_up_days !== settings.follow_up_days}
									<p>Follow-up delay: {settings.follow_up_days} → {localSettings.follow_up_days} day(s)</p>
								{/if}
								{#if localSettings.auto_follow_up_enabled !== settings.auto_follow_up_enabled}
									<p>Automatic follow-up: {settings.auto_follow_up_enabled ? 'Enabled' : 'Disabled'} → {localSettings.auto_follow_up_enabled ? 'Enabled' : 'Disabled'}</p>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
			<button
				type="button"
				on:click={closeModal}
				disabled={saving}
				class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
			>
				Cancel
			</button>
			<button
				type="button"
				on:click={saveSettings}
				disabled={saving || !projectId || projectId === 'undefined'}
				class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] disabled:opacity-50 transition-colors flex items-center gap-2"
			>
				{#if saving}
					<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
				{/if}
				{saving ? 'Saving...' : 'Save'}
			</button>
		</div>
	</div>
</div>

<style>
    .peer:checked + div {
        background-color: #3b82f6;
    }

    .peer:checked + div:after {
        transform: translateX(100%);
    }

    .peer:focus + div {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
</style>