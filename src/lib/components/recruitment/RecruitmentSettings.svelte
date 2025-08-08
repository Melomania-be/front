<!-- src/lib/components/recruitment/RecruitmentSettings.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { X, Settings, Info } from 'lucide-svelte'
	import type { RecruitmentSettings as SettingsType } from '$lib/types'

	export let projectId: string
	export let settings: SettingsType

	const dispatch = createEventDispatcher()

	let localSettings = {
		follow_up_days: settings.follow_up_days,
		auto_follow_up_enabled: settings.auto_follow_up_enabled
	}

	let saving = false

	async function saveSettings() {
		saving = true

		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/settings`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(localSettings)
			})

			if (response.ok) {
				dispatch('update')
				dispatch('close')
			} else {
				alert('Erreur lors de la sauvegarde des paramètres')
			}
		} catch (error) {
			console.error('Error saving settings:', error)
			alert('Erreur lors de la sauvegarde des paramètres')
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
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	<div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
		<!-- Header -->
		<div class="flex items-center justify-between p-6 border-b">
			<div class="flex items-center gap-2">
				<Settings class="text-[#6B9AD9]" size={24} />
				<h2 class="text-xl font-semibold">Paramètres de Recrutement</h2>
			</div>
			<button
				on:click={closeModal}
				class="text-gray-400 hover:text-gray-600 transition-colors"
			>
				<X size={24} />
			</button>
		</div>

		<!-- Contenu -->
		<div class="p-6 space-y-6">
			<!-- Suivi automatique -->
			<div class="space-y-4">
				<div class="flex items-center gap-2">
					<h3 class="text-lg font-semibold">Suivi Automatique</h3>
					<Info size={16} class="text-gray-400" title="Configuration du suivi automatique des contacts" />
				</div>

				<div class="space-y-4">
					<!-- Activation du suivi automatique -->
					<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
						<div>
							<label class="font-medium text-gray-900">
								Activer le suivi automatique
							</label>
							<p class="text-sm text-gray-600">
								Les contacts en "attente de réponse" passeront automatiquement en "à relancer" après le délai configuré
							</p>
						</div>
						<label class="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								bind:checked={localSettings.auto_follow_up_enabled}
								class="sr-only peer"
							/>
							<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
						</label>
					</div>

					<!-- Délai de relance -->
					<div class="space-y-2">
						<label for="follow-up-days" class="block font-medium text-gray-900">
							Délai avant relance (en jours)
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
                jour(s) après le premier contact
              </span>
						</div>
						<p class="text-sm text-gray-500">
							Si un contact est en "attente de réponse" depuis {localSettings.follow_up_days} jour(s),
							il passera automatiquement en "à relancer"
						</p>
					</div>
				</div>
			</div>

			<!-- Information sur l'impact -->
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div class="flex items-start gap-2">
					<Info size={16} class="text-blue-500 mt-0.5 flex-shrink-0" />
					<div class="text-sm">
						<p class="font-medium text-blue-900 mb-1">Impact des modifications</p>
						<p class="text-blue-800">
							La modification du délai de relance recalculera automatiquement le statut de tous les contacts
							actuellement en "attente de réponse" en fonction de leur date de contact initial.
						</p>
					</div>
				</div>
			</div>

			<!-- Statistiques actuelles -->
			<div class="bg-gray-50 rounded-lg p-4">
				<h4 class="font-medium text-gray-900 mb-2">Aperçu des paramètres actuels</h4>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span class="text-gray-600">Suivi automatique :</span>
						<span class="font-medium {settings.auto_follow_up_enabled ? 'text-green-600' : 'text-red-600'}">
              {settings.auto_follow_up_enabled ? 'Activé' : 'Désactivé'}
            </span>
					</div>
					<div>
						<span class="text-gray-600">Délai actuel :</span>
						<span class="font-medium">{settings.follow_up_days} jour(s)</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
			<button
				type="button"
				on:click={closeModal}
				disabled={saving}
				class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
			>
				Annuler
			</button>
			<button
				type="button"
				on:click={saveSettings}
				disabled={saving}
				class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] disabled:opacity-50 flex items-center gap-2"
			>
				{#if saving}
					<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
				{/if}
				{saving ? 'Sauvegarde...' : 'Sauvegarder'}
			</button>
		</div>
	</div>
</div>