<!-- src/lib/components/recruitment/AddManualContactModal.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import { X, UserPlus, AlertTriangle } from 'lucide-svelte'
	import type { Section } from '$lib/types'

	export let projectId: string

	const dispatch = createEventDispatcher()

	let formData = {
		first_name: '',
		last_name: '',
		email: '',
		phone: '',
		messenger: '',
		section_id: null as number | null,
		notes: ''
	}

	let sections: Section[] = []
	let saving = false
	let errors: Record<string, string> = {}

	onMount(async () => {
		await fetchSections()
	})

	async function fetchSections() {
		try {
			const response = await fetch('/api/sections')
			if (response.ok) {
				sections = await response.json()
			}
		} catch (error) {
			console.error('Error fetching sections:', error)
		}
	}

	async function saveContact() {
		// Validation
		errors = {}

		if (!formData.first_name.trim()) {
			errors.first_name = 'Le prénom est requis'
		}

		if (!formData.last_name.trim()) {
			errors.last_name = 'Le nom est requis'
		}

		if (formData.email && !isValidEmail(formData.email)) {
			errors.email = 'Format d\'email invalide'
		}

		if (!formData.email && !formData.phone && !formData.messenger) {
			errors.contact = 'Au moins un moyen de contact est requis (email, téléphone ou messenger)'
		}

		if (Object.keys(errors).length > 0) {
			return
		}

		saving = true

		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/contacts`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			})

			if (response.ok) {
				const newContact = await response.json()
				dispatch('contactAdded', newContact)
				dispatch('close')
			} else {
				const errorData = await response.json()
				alert(`Erreur: ${errorData.message || 'Impossible de créer le contact'}`)
			}
		} catch (error) {
			console.error('Error saving contact:', error)
			alert('Erreur lors de la sauvegarde du contact')
		} finally {
			saving = false
		}
	}

	function closeModal() {
		dispatch('close')
	}

	function isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return emailRegex.test(email)
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal()
		}
	}

	function clearForm() {
		formData = {
			first_name: '',
			last_name: '',
			email: '',
			phone: '',
			messenger: '',
			section_id: null,
			notes: ''
		}
		errors = {}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
		<!-- Header -->
		<div class="flex items-center justify-between p-6 border-b">
			<div class="flex items-center gap-2">
				<UserPlus class="text-[#6B9AD9]" size={24} />
				<h2 class="text-xl font-semibold">Ajouter un Contact Manuel</h2>
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
			<!-- Informations personnelles -->
			<div class="space-y-4">
				<h3 class="text-lg font-semibold text-gray-900">Informations personnelles</h3>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="first_name" class="block text-sm font-medium text-gray-700 mb-1">
							Prénom *
						</label>
						<input
							id="first_name"
							type="text"
							bind:value={formData.first_name}
							class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.first_name ? 'border-red-500' : 'border-gray-300'}"
							placeholder="Prénom"
						/>
						{#if errors.first_name}
							<p class="text-sm text-red-600 mt-1">{errors.first_name}</p>
						{/if}
					</div>

					<div>
						<label for="last_name" class="block text-sm font-medium text-gray-700 mb-1">
							Nom *
						</label>
						<input
							id="last_name"
							type="text"
							bind:value={formData.last_name}
							class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.last_name ? 'border-red-500' : 'border-gray-300'}"
							placeholder="Nom"
						/>
						{#if errors.last_name}
							<p class="text-sm text-red-600 mt-1">{errors.last_name}</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Informations de contact -->
			<div class="space-y-4">
				<h3 class="text-lg font-semibold text-gray-900">Informations de contact</h3>
				<p class="text-sm text-gray-600">Au moins un moyen de contact est requis</p>

				<div class="space-y-4">
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
							Email
						</label>
						<input
							id="email"
							type="email"
							bind:value={formData.email}
							class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.email ? 'border-red-500' : 'border-gray-300'}"
							placeholder="exemple@email.com"
						/>
						{#if errors.email}
							<p class="text-sm text-red-600 mt-1">{errors.email}</p>
						{/if}
					</div>

					<div>
						<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
							Téléphone
						</label>
						<input
							id="phone"
							type="tel"
							bind:value={formData.phone}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="+33 6 12 34 56 78"
						/>
					</div>

					<div>
						<label for="messenger" class="block text-sm font-medium text-gray-700 mb-1">
							Messenger
						</label>
						<input
							id="messenger"
							type="text"
							bind:value={formData.messenger}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="@username ou lien Messenger"
						/>
					</div>

					{#if errors.contact}
						<div class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
							<AlertTriangle size={16} class="text-red-500 mt-0.5 flex-shrink-0" />
							<p class="text-sm text-red-700">{errors.contact}</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Section -->
			<div class="space-y-4">
				<h3 class="text-lg font-semibold text-gray-900">Section</h3>

				<div>
					<label for="section" class="block text-sm font-medium text-gray-700 mb-1">
						Section musicale
					</label>
					<select
						id="section"
						bind:value={formData.section_id}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value={null}>Sélectionner une section</option>
						{#each sections as section}
							<option value={section.id}>{section.name}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Notes -->
			<div class="space-y-4">
				<h3 class="text-lg font-semibold text-gray-900">Notes</h3>

				<div>
					<label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
						Notes complémentaires
					</label>
					<textarea
						id="notes"
						bind:value={formData.notes}
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="Notes sur ce contact, contexte de rencontre, recommandation..."
					></textarea>
				</div>
			</div>

			<!-- Aperçu -->
			{#if formData.first_name || formData.last_name}
				<div class="bg-gray-50 rounded-lg p-4">
					<h4 class="font-medium text-gray-900 mb-2">Aperçu du contact</h4>
					<div class="text-sm space-y-1">
						<p><span class="font-medium">Nom :</span> {formData.first_name} {formData.last_name}</p>
						{#if formData.email}
							<p><span class="font-medium">Email :</span> {formData.email}</p>
						{/if}
						{#if formData.phone}
							<p><span class="font-medium">Téléphone :</span> {formData.phone}</p>
						{/if}
						{#if formData.messenger}
							<p><span class="font-medium">Messenger :</span> {formData.messenger}</p>
						{/if}
						{#if formData.section_id}
							<p><span class="font-medium">Section :</span> {sections.find(s => s.id === formData.section_id)?.name}</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex justify-between p-6 border-t bg-gray-50">
			<button
				type="button"
				on:click={clearForm}
				class="px-4 py-2 text-gray-600 hover:text-gray-800"
			>
				Effacer le formulaire
			</button>

			<div class="flex gap-3">
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
					on:click={saveContact}
					disabled={saving}
					class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] disabled:opacity-50 flex items-center gap-2"
				>
					{#if saving}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
					{/if}
					{saving ? 'Ajout...' : 'Ajouter le contact'}
				</button>
			</div>
		</div>
	</div>
</div>