<!-- src/lib/components/recruitment/ImportContactsModal.svelte - Version complète corrigée -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import { X, Upload, Search, Users, AlertTriangle, CheckCircle } from 'lucide-svelte'
	import type { Contact } from '$lib/types'

	export let projectId: string

	const dispatch = createEventDispatcher()

	let searchQuery = ''
	let searchResults: Contact[] = []
	let selectedContacts: Contact[] = []
	let searching = false
	let importing = false
	let searchPerformed = false
	let initialLoadPerformed = false // ✅ NOUVEAU FLAG

	let importResults: {
		imported: any[]
		conflicts: any[]
		errors: string[]
	} | null = null

	// ✅ CORRECTION : Charger automatiquement les contacts au montage
	onMount(async () => {
		await loadInitialContacts()
	})

	// ✅ NOUVELLE FONCTION : Chargement initial automatique
	async function loadInitialContacts() {
		if (initialLoadPerformed) return

		searching = true
		initialLoadPerformed = true

		try {
			console.log('🔄 Loading initial contacts...')

			const response = await fetch(`/api/projects/${projectId}/management/recruitment/search-contacts`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					filter: '', // Recherche vide pour avoir tous les contacts
					criteria: {
						name: '',
						email: '',
						instruments: '',
						projects: ''
					}
				})
			})

			if (response.ok) {
				const data = await response.json()
				searchResults = data.data || data || []
				searchPerformed = true
				console.log('✅ Initial contacts loaded:', searchResults.length)
			} else {
				console.error('❌ Failed to load initial contacts')
			}
		} catch (error) {
			console.error('❌ Error loading initial contacts:', error)
		} finally {
			searching = false
		}
	}

	// ✅ FONCTION MODIFIÉE : Recherche spécifique
	async function searchContacts() {
		if (!searchQuery.trim()) {
			// Si recherche vide, recharger tous les contacts
			await loadInitialContacts()
			return
		}

		searching = true
		searchPerformed = true

		try {
			console.log('🔍 Searching contacts with query:', searchQuery)

			const response = await fetch(`/api/projects/${projectId}/management/recruitment/search-contacts`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					filter: searchQuery,
					criteria: {
						name: searchQuery,
						email: searchQuery,
						instruments: searchQuery,
						projects: searchQuery
					}
				})
			})

			if (response.ok) {
				const data = await response.json()
				searchResults = data.data || data || []
				console.log('✅ Search completed:', searchResults.length, 'results')
			} else {
				console.error('❌ Search failed')
			}
		} catch (error) {
			console.error('❌ Error searching contacts:', error)
			alert('Erreur lors de la recherche de contacts')
		} finally {
			searching = false
		}
	}

	function toggleContactSelection(contact: Contact) {
		const index = selectedContacts.findIndex(c => c.id === contact.id)
		if (index >= 0) {
			selectedContacts = selectedContacts.filter(c => c.id !== contact.id)
		} else {
			selectedContacts = [...selectedContacts, contact]
		}
	}

	function selectAllSearchResults() {
		selectedContacts = [...searchResults]
	}

	function clearSelection() {
		selectedContacts = []
	}

	async function importSelectedContacts() {
		if (selectedContacts.length === 0) return

		importing = true

		try {
			console.log('📥 Importing selected contacts...')
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/contacts/import`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contact_ids: selectedContacts.map(c => c.id)
				})
			})

			if (response.ok) {
				importResults = await response.json()

				// ✅ CORRECTION : Émettre l'événement immédiatement après import réussi
				if (importResults && importResults.imported.length > 0) {
					dispatch('contactsImported', importResults)
				}
			} else {
				alert('Erreur lors de l\'importation des contacts')
			}
		} catch (error) {
			console.error('Error importing contacts:', error)
			alert('Erreur lors de l\'importation des contacts')
		} finally {
			importing = false
		}
	}

	function closeModal() {
		dispatch('close')
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal()
		} else if (event.key === 'Enter' && event.target?.tagName !== 'BUTTON') {
			searchContacts()
		}
	}

	// ✅ FONCTION NOUVELLE : Reset et rechargement
	function resetSearch() {
		searchQuery = ''
		selectedContacts = []
		searchPerformed = false
		importResults = null
		initialLoadPerformed = false
		loadInitialContacts()
	}

	function getContactDisplay(contact: Contact): string {
		const parts = [contact.firstName, contact.lastName].filter(Boolean)
		if (contact.email) parts.push(`(${contact.email})`)
		return parts.join(' ')
	}

	function getContactInstruments(contact: Contact): string {
		if (!contact.instruments || contact.instruments.length === 0) return ''
		return contact.instruments.map(i => i.name).join(', ')
	}

	function getContactProjects(contact: Contact): string {
		if (!contact.participants || contact.participants.length === 0) return ''
		const projects = contact.participants
			.map(p => p.project?.name)
			.filter(Boolean)
			.slice(0, 3)
		return projects.join(', ') + (contact.participants.length > 3 ? '...' : '')
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	<div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
		<!-- Header -->
		<div class="flex items-center justify-between p-6 border-b">
			<div class="flex items-center gap-2">
				<Upload class="text-[#6B9AD9]" size={24} />
				<h2 class="text-xl font-semibold">Importer des Contacts</h2>
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
			{#if !importResults}
				<!-- Recherche -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold text-gray-900">Rechercher des contacts</h3>
					<p class="text-sm text-gray-600">
						Tous les contacts sont affichés par défaut. Utilisez la recherche pour filtrer par nom, email, instrument ou projet.
					</p>

					<div class="flex gap-2">
						<div class="flex-1 relative">
							<Search class="absolute left-3 top-3 text-gray-400" size={16} />
							<input
								type="text"
								bind:value={searchQuery}
								placeholder="Filtrer les contacts (optionnel)..."
								class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								on:keydown={(e) => e.key === 'Enter' && searchContacts()}
							/>
						</div>
						<button
							on:click={searchContacts}
							disabled={searching}
							class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] disabled:opacity-50 flex items-center gap-2"
						>
							{#if searching}
								<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
							{:else}
								<Search size={16} />
							{/if}
							{searching ? 'Recherche...' : 'Filtrer'}
						</button>

						{#if searchQuery}
							<button
								on:click={resetSearch}
								class="px-4 py-2 text-gray-600 hover:text-gray-800"
							>
								Réinitialiser
							</button>
						{/if}
					</div>
				</div>

				<!-- ✅ INDICATEUR DE CHARGEMENT INITIAL -->
				{#if searching && !searchPerformed}
					<div class="text-center py-8">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B9AD9] mx-auto mb-4"></div>
						<p class="text-gray-600">Chargement des contacts...</p>
					</div>
				{:else}
					<!-- Résultats -->
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<h4 class="font-semibold text-gray-900">
								Contacts disponibles ({searchResults.length})
							</h4>

							{#if searchResults.length > 0}
								<div class="flex gap-2">
									<button
										on:click={selectAllSearchResults}
										class="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
									>
										Tout sélectionner
									</button>
									{#if selectedContacts.length > 0}
										<button
											on:click={clearSelection}
											class="px-3 py-1 text-sm bg-red-200 hover:bg-red-300 rounded"
										>
											Désélectionner ({selectedContacts.length})
										</button>
									{/if}
								</div>
							{/if}
						</div>

						{#if searchResults.length === 0}
							<div class="text-center py-8 text-gray-500">
								<Users size={48} class="mx-auto mb-4 opacity-50" />
								{#if searchQuery}
									<p>Aucun contact trouvé pour cette recherche.</p>
									<p class="text-sm">Essayez avec d'autres termes de recherche.</p>
								{:else}
									<p>Aucun contact disponible dans la base de données.</p>
								{/if}
							</div>
						{:else}
							<!-- Tableau des contacts -->
							<div class="border border-gray-200 rounded-lg overflow-hidden">
								<div class="max-h-96 overflow-y-auto">
									<table class="w-full text-sm">
										<thead class="bg-gray-50 sticky top-0">
										<tr>
											<th class="px-4 py-3 text-left w-12">
												<input
													type="checkbox"
													checked={selectedContacts.length === searchResults.length && searchResults.length > 0}
													on:change={(e) => e.target.checked ? selectAllSearchResults() : clearSelection()}
													class="rounded"
												/>
											</th>
											<th class="px-4 py-3 text-left font-semibold">Contact</th>
											<th class="px-4 py-3 text-left font-semibold">Instruments</th>
											<th class="px-4 py-3 text-left font-semibold">Projets passés</th>
										</tr>
										</thead>
										<tbody>
										{#each searchResults as contact}
											<tr class="border-t hover:bg-gray-50">
												<td class="px-4 py-3">
													<input
														type="checkbox"
														checked={selectedContacts.some(c => c.id === contact.id)}
														on:change={() => toggleContactSelection(contact)}
														class="rounded"
													/>
												</td>
												<td class="px-4 py-3">
													<div class="font-medium">{contact.firstName} {contact.lastName}</div>
													{#if contact.email}
														<div class="text-sm text-gray-500">{contact.email}</div>
													{/if}
													{#if contact.phone}
														<div class="text-sm text-gray-500">{contact.phone}</div>
													{/if}
												</td>
												<td class="px-4 py-3 text-sm text-gray-600">
													{getContactInstruments(contact) || '-'}
												</td>
												<td class="px-4 py-3 text-sm text-gray-600">
													{getContactProjects(contact) || '-'}
												</td>
											</tr>
										{/each}
										</tbody>
									</table>
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Actions d'import -->
				{#if selectedContacts.length > 0}
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<div class="flex items-center justify-between">
							<div>
								<h4 class="font-semibold text-blue-900">
									Prêt à importer {selectedContacts.length} contact(s)
								</h4>
								<p class="text-sm text-blue-700 mt-1">
									Ces contacts seront ajoutés à votre liste de recrutement avec le statut "Pas encore contacté".
								</p>
							</div>
							<button
								on:click={importSelectedContacts}
								disabled={importing}
								class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
							>
								{#if importing}
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
								{/if}
								{importing ? 'Import...' : 'Importer'}
							</button>
						</div>
					</div>
				{/if}

			{:else}
				<!-- Résultats d'import -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold text-gray-900">Résultats de l'importation</h3>

					<!-- Succès -->
					{#if importResults.imported.length > 0}
						<div class="bg-green-50 border border-green-200 rounded-lg p-4">
							<div class="flex items-start gap-2">
								<CheckCircle class="text-green-500 mt-0.5 flex-shrink-0" size={20} />
								<div>
									<h4 class="font-semibold text-green-900">
										{importResults.imported.length} contact(s) importé(s) avec succès
									</h4>
									<div class="mt-2 space-y-1">
										{#each importResults.imported as contact}
											<p class="text-sm text-green-800">
												✓ {contact.first_name} {contact.last_name}
											</p>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Conflits -->
					{#if importResults.conflicts.length > 0}
						<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
							<div class="flex items-start gap-2">
								<AlertTriangle class="text-yellow-500 mt-0.5 flex-shrink-0" size={20} />
								<div>
									<h4 class="font-semibold text-yellow-900">
										{importResults.conflicts.length} conflit(s) détecté(s)
									</h4>
									<p class="text-sm text-yellow-800 mt-1">
										Ces contacts sont déjà présents dans votre liste de recrutement :
									</p>
									<div class="mt-2 space-y-1">
										{#each importResults.conflicts as conflict}
											<p class="text-sm text-yellow-800">
												⚠️ {conflict.contact.firstName} {conflict.contact.lastName}
												(statut actuel: {conflict.existing_status})
											</p>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Erreurs -->
					{#if importResults.errors.length > 0}
						<div class="bg-red-50 border border-red-200 rounded-lg p-4">
							<div class="flex items-start gap-2">
								<AlertTriangle class="text-red-500 mt-0.5 flex-shrink-0" size={20} />
								<div>
									<h4 class="font-semibold text-red-900">
										{importResults.errors.length} erreur(s)
									</h4>
									<div class="mt-2 space-y-1">
										{#each importResults.errors as error}
											<p class="text-sm text-red-800">❌ {error}</p>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
			<button
				type="button"
				on:click={closeModal}
				class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
			>
				{importResults ? 'Fermer' : 'Annuler'}
			</button>

			{#if importResults}
				<button
					type="button"
					on:click={resetSearch}
					class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4]"
				>
					Nouvelle importation
				</button>
			{/if}
		</div>
	</div>
</div>