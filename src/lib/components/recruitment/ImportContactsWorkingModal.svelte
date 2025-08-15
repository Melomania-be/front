<!-- src/lib/components/recruitment/ImportContactsWorkingModal.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import { X, Upload, Search, Users, AlertTriangle, CheckCircle, Filter } from 'lucide-svelte'
	import AdvancedFilterer from '$lib/components/AdvancedFilterer.svelte'
	import type { Contact } from '$lib/types'
	import type { TableData } from '$lib/types/TableData'

	export let projectId: string

	const dispatch = createEventDispatcher()

	// État pour la recherche avancée (copié de votre page contacts/search)
	let meta: any
	let data: TableData<Contact>
	let columns: any
	let options: {
		filters: {
			type: string;
			filtersDepth1: {
				type: string;
				filtersDepth2: { relation: string; column: string; operation: string; filter: string }[];
			}[];
		};
		page: number;
		limit: number;
		orderBy: string;
		order: string;
	} = {
		filters: {
			type: 'and',
			filtersDepth1: [
				{ type: 'or', filtersDepth2: [] },
				{ type: 'or', filtersDepth2: [] },
				{ type: 'or', filtersDepth2: [] },
				{ type: 'or', filtersDepth2: [] }
			]
		},
		page: 1,
		limit: 250,
		orderBy: 'id',
		order: 'asc'
	}

	let selectedContacts: Contact[] = []
	let importing = false
	let isLoaded = false

	let importResults: {
		imported: any[]
		conflicts: any[]
		errors: string[]
	} | null = null

	onMount(async () => {
		await fetchData()
	})

	// Utiliser exactement la même logique que votre page contacts/search
	async function fetchData() {
		try {
			let response = await fetch('/test/api', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(options)
			});

			if (response.status >= 400 && response.status < 500) {
				const jsonResponse = await response.json();
				const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
				alert(error);
				return;
			}

			if (response.ok) {
				const jsonResponse = await response.json();

				// Mapper les contacts pour avoir la bonne structure
				const mappedContacts = (jsonResponse.data.data || []).map(contact => ({
					...contact,
					// S'assurer que firstName et lastName sont présents
					firstName: contact.firstName || contact.first_name,
					lastName: contact.lastName || contact.last_name,
					// Mapper les autres champs si nécessaire
					email: contact.email || '',
					phone: contact.phone || '',
					messenger: contact.messenger || '',
					comments: contact.comments || ''
				}));

				data = {
					data: mappedContacts,
					columns: ['id', 'firstName', 'lastName', 'email', 'messenger', 'phone', 'comments'],
					notOrderedColumns: ['instruments', 'projects']
				};
				meta = jsonResponse.data.meta;
				columns = jsonResponse.columns;
				isLoaded = true;

				console.log('✅ Data loaded:', data.data.length, 'contacts');
				console.log('📊 First contact structure:', data.data[0]);
				console.log('📊 Columns:', columns);
			}
		} catch (error) {
			console.error('❌ Error fetching data:', error);
			alert('Erreur lors du chargement des contacts');
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

	function selectAllContacts() {
		selectedContacts = [...data.data]
	}

	function clearSelection() {
		selectedContacts = []
	}

	async function importSelectedContacts() {
		if (selectedContacts.length === 0) {
			alert('Aucun contact sélectionné')
			return
		}

		importing = true

		try {
			console.log('📥 Importing selected contacts...')
			console.log('🔍 Selected contacts:', selectedContacts.map(c => ({id: c.id, name: `${c.firstName} ${c.lastName}`})))

			const response = await fetch(`/api/projects/${projectId}/management/recruitment/contacts/import`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contact_ids: selectedContacts.map(c => c.id).filter(id => id != null)
				})
			})

			console.log('📡 Import response status:', response.status)

			if (response.ok) {
				importResults = await response.json()
				console.log('✅ Import completed:', importResults)

				if (importResults && (importResults.imported.length > 0 || importResults.conflicts.length > 0)) {
					dispatch('contactsImported', importResults)
				}
			} else {
				const errorText = await response.text()
				console.error('❌ Import failed:', response.status, errorText)
				try {
					const errorData = JSON.parse(errorText)
					alert(`Erreur lors de l'importation: ${errorData.error || 'Erreur inconnue'}`)
				} catch {
					alert(`Erreur lors de l'importation: ${errorText}`)
				}
			}
		} catch (error) {
			console.error('❌ Error importing contacts:', error)
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
		}
	}

	function resetImport() {
		importResults = null
		selectedContacts = []
		// Réinitialiser les filtres
		options = {
			filters: {
				type: 'and',
				filtersDepth1: [
					{ type: 'or', filtersDepth2: [] },
					{ type: 'or', filtersDepth2: [] },
					{ type: 'or', filtersDepth2: [] },
					{ type: 'or', filtersDepth2: [] }
				]
			},
			page: 1,
			limit: 250,
			orderBy: 'id',
			order: 'asc'
		}
		fetchData()
	}

	function getContactInstruments(contact: Contact): string {
		if (!contact.instruments || contact.instruments.length === 0) return ''
		return contact.instruments.map(i => `${i.name} (${i.pivot_proficiency_level || 'Non spécifié'})`).join(', ')
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
	<div class="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
		<!-- Header -->
		<div class="flex items-center justify-between p-6 border-b bg-gray-50">
			<div class="flex items-center gap-2">
				<Upload class="text-[#6B9AD9]" size={24} />
				<h2 class="text-xl font-semibold">Importer des Contacts depuis la Base de Données</h2>
			</div>
			<button
				on:click={closeModal}
				class="text-gray-400 hover:text-gray-600 transition-colors"
			>
				<X size={24} />
			</button>
		</div>

		<!-- Contenu -->
		<div class="p-6">
			{#if !importResults}
				<!-- Recherche Avancée -->
				<div class="space-y-6">
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<div class="flex items-center gap-2 mb-2">
							<Search class="text-blue-600" size={20} />
							<h3 class="text-lg font-semibold text-blue-900">Recherche Avancée</h3>
						</div>
						<p class="text-sm text-blue-800">
							Utilisez les filtres avancés pour rechercher des contacts par nom, email, instruments, niveau de compétence, projets passés, etc.
						</p>
					</div>

					<!-- Filtreur Avancé -->
					{#if isLoaded && data && columns}
						<div class="bg-[#E7E7E7] rounded-lg">
							<AdvancedFilterer
								bind:columns
								bind:meta
								bind:data
								bind:options
								uniqueUrl=""
								showData={true}
								paginatorTop={false}
								filterLevel={[]}
								on:optionsUpdated={fetchData}
							>
								<!-- Tableau personnalisé pour la sélection -->
								<div class="bg-white rounded-lg p-4">
									<!-- Actions de sélection -->
									<div class="flex items-center justify-between mb-4">
										<h4 class="font-semibold text-gray-900 flex items-center gap-2">
											<Users size={20} class="text-[#6B9AD9]" />
											Contacts disponibles ({data.data.length})
										</h4>

										{#if data.data.length > 0}
											<div class="flex gap-2">
												<button
													on:click={selectAllContacts}
													class="px-3 py-1 text-sm bg-[#6B9AD9] text-white hover:bg-[#5a9bb4] rounded-lg font-semibold"
												>
													Tout sélectionner
												</button>
												{#if selectedContacts.length > 0}
													<button
														on:click={clearSelection}
														class="px-3 py-1 text-sm bg-red-500 text-white hover:bg-red-600 rounded-lg font-semibold"
													>
														Désélectionner ({selectedContacts.length})
													</button>
												{/if}
											</div>
										{/if}
									</div>

									{#if data.data.length === 0}
										<div class="text-center py-12">
											<Users size={64} class="mx-auto mb-4 opacity-30 text-gray-400" />
											<h3 class="text-lg font-medium text-gray-900">Aucun contact trouvé</h3>
											<p class="text-gray-500 mt-2">
												Essayez de modifier vos critères de recherche ou réinitialisez les filtres.
											</p>
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
																checked={selectedContacts.length === data.data.length && data.data.length > 0}
																on:change={(e) => e.target.checked ? selectAllContacts() : clearSelection()}
																class="rounded"
															/>
														</th>
														<th class="px-4 py-3 text-left font-semibold">Contact</th>
														<th class="px-4 py-3 text-left font-semibold">Instruments & Niveaux</th>
														<th class="px-4 py-3 text-left font-semibold">Projets passés</th>
														<th class="px-4 py-3 text-left font-semibold">Statut</th>
													</tr>
													</thead>
													<tbody>
													{#each data.data as contact (contact.id)}
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
																<div class="flex items-center space-x-3">
																	<div class="w-10 h-10 bg-[#6B9AD9] rounded-full flex items-center justify-center">
																		<span class="text-white font-bold text-sm">
																			{(contact.firstName || contact.first_name || 'P').charAt(0)}{(contact.lastName || contact.last_name || 'N').charAt(0)}
																		</span>
																	</div>
																	<div>
																		<div class="font-medium text-gray-900">
																			{contact.firstName || contact.first_name || 'Prénom'} {contact.lastName || contact.last_name || 'Nom'}
																		</div>
																		<div class="text-xs text-blue-600 font-mono">ID: {contact.id}</div>
																		{#if contact.email}
																			<div class="text-sm text-gray-500">{contact.email}</div>
																		{/if}
																		{#if contact.phone}
																			<div class="text-sm text-gray-500">{contact.phone}</div>
																		{/if}
																		{#if contact.messenger}
																			<div class="text-sm text-gray-500">Messenger: {contact.messenger}</div>
																		{/if}
																	</div>
																</div>
															</td>
															<td class="px-4 py-3">
																<div class="text-sm text-gray-600">
																	{#if contact.instruments && contact.instruments.length > 0}
																		{#each contact.instruments as instrument}
																			<div class="mb-1">
																				<span class="font-medium">{instrument.name}</span>
																				{#if instrument.pivot_proficiency_level}
																					<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
																						{instrument.pivot_proficiency_level}
																					</span>
																				{/if}
																				<span class="text-xs text-gray-500 ml-1">({instrument.family})</span>
																			</div>
																		{/each}
																	{:else}
																		<span class="text-gray-400 italic">Aucun instrument</span>
																	{/if}
																</div>
															</td>
															<td class="px-4 py-3 text-sm text-gray-600">
																{getContactProjects(contact) || '-'}
															</td>
															<td class="px-4 py-3">
																<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {contact.validated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
																	{contact.validated ? 'Validé' : 'En attente de validation'}
																</span>
															</td>
														</tr>
													{/each}
													</tbody>
												</table>
											</div>
										</div>
									{/if}
								</div>
							</AdvancedFilterer>
						</div>
					{:else}
						<!-- Chargement initial -->
						<div class="text-center py-12">
							<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9AD9] mx-auto mb-4"></div>
							<p class="text-gray-600">Chargement des contacts et filtres...</p>
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
									class="px-6 py-3 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] disabled:opacity-50 flex items-center gap-2 font-semibold"
								>
									{#if importing}
										<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
									{/if}
									{importing ? 'Import en cours...' : 'Importer les contacts'}
								</button>
							</div>
						</div>
					{/if}
				</div>

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
									<div class="mt-2 max-h-32 overflow-y-auto">
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
									<div class="mt-2 max-h-32 overflow-y-auto">
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
									<div class="mt-2 max-h-32 overflow-y-auto">
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
					on:click={resetImport}
					class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4]"
				>
					Nouvelle importation
				</button>
			{/if}
		</div>
	</div>
</div>