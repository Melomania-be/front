<!-- src/lib/components/recruitment/ImportContactsWorkingModal.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import { X, Upload, Search, Users, AlertTriangle, CheckCircle, Filter } from 'lucide-svelte'
	import AdvancedFilterer from '$lib/components/AdvancedFilterer.svelte'
	import QueryBuilder from '$lib/components/QueryBuilder.svelte'
	import type { Contact } from '$lib/types'
	import type { TableData } from '$lib/types/TableData'
	import {familyToEmoji, familyToStyle, levelSimplificator, levelToStyle} from '$lib/components/contact/StylesFunctions'

	export let projectId: string

	const dispatch = createEventDispatcher()

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
	let existingContacts: any[] = []

	let operations = ['none', '=', '!=', '>', '>=', '<', '<=', 'like']
	let typesOfWhere = ['and', 'or']
	let filterLevel: string[] = []
	let instrumentFamily: string[] = []
	let selectedLevelInstruments: [number, string | null][] = []

	let importResults: {
		imported: any[]
		conflicts: any[]
		errors: string[]
	} | null = null

	let showDuplicateConfirm = false
	let duplicateContact: Contact | null = null
	let duplicateMatches: any[] = []
	let pendingImport = false

	onMount(async () => {
		await Promise.all([fetchData(), fetchExistingContacts()])
	})

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

				const mappedContacts = (jsonResponse.data.data || []).map(contact => ({
					...contact,
					firstName: contact.firstName || contact.first_name,
					lastName: contact.lastName || contact.last_name,
					email: contact.email || '',
					phone: contact.phone || '',
					messenger: contact.messenger || '',
					comments: contact.comments || '',
					projects: contact.projects || [],
					participants: contact.participants || []
				}));

				data = {
					data: mappedContacts,
					columns: ['id', 'firstName', 'lastName', 'email', 'messenger', 'phone', 'comments'],
					notOrderedColumns: ['instruments', 'projects']
				};
				meta = jsonResponse.data.meta;
				columns = jsonResponse.columns;
				isLoaded = true;
			}
		} catch (error) {
			alert('Error loading contacts');
		}
	}

	async function fetchExistingContacts() {
		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/contacts`)
			if (response.ok) {
				const data = await response.json()
				existingContacts = Array.isArray(data.data) ? data.data : []
			}
		} catch (error) {
			console.error('Error fetching existing contacts:', error)
		}
	}

	function isContactInProject(contact: Contact): boolean {
		return existingContacts.some(existing =>
			existing.contact_id === contact.id ||
			(existing.email && contact.email && existing.email.toLowerCase() === contact.email.toLowerCase()) ||
			(existing.first_name && existing.last_name && contact.firstName && contact.lastName &&
				existing.first_name.toLowerCase().trim() === contact.firstName.toLowerCase().trim() &&
				existing.last_name.toLowerCase().trim() === contact.lastName.toLowerCase().trim())
		)
	}

	function findSimilarContacts(contact: Contact): any[] {
		const similar = existingContacts.filter(existing => {
			if (existing.contact_id === contact.id) return true

			if (existing.email && contact.email &&
				existing.email.toLowerCase() === contact.email.toLowerCase()) return true

			const firstName1 = (existing.first_name || '').toLowerCase().trim()
			const lastName1 = (existing.last_name || '').toLowerCase().trim()
			const firstName2 = (contact.firstName || '').toLowerCase().trim()
			const lastName2 = (contact.lastName || '').toLowerCase().trim()

			if (firstName1 === firstName2 && lastName1 === lastName2) return true

			const similarity = calculateNameSimilarity(firstName1 + ' ' + lastName1, firstName2 + ' ' + lastName2)
			return similarity > 0.8
		})

		return similar
	}

	function calculateNameSimilarity(name1: string, name2: string): number {
		const longer = name1.length > name2.length ? name1 : name2
		const shorter = name1.length > name2.length ? name2 : name1

		if (longer.length === 0) return 1.0

		const editDistance = getEditDistance(longer, shorter)
		return (longer.length - editDistance) / longer.length
	}

	function getEditDistance(s1: string, s2: string): number {
		const costs = []
		for (let i = 0; i <= s2.length; i++) {
			let lastValue = i
			for (let j = 0; j <= s1.length; j++) {
				if (i === 0) {
					costs[j] = j
				} else if (j > 0) {
					let newValue = costs[j - 1]
					if (s1.charAt(j - 1) !== s2.charAt(i - 1)) {
						newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
					}
					costs[j - 1] = lastValue
					lastValue = newValue
				}
			}
			if (i > 0) {
				costs[s1.length] = lastValue
			}
		}
		return costs[s1.length]
	}

	function toggleContactSelection(contact: Contact) {
		const similarContacts = findSimilarContacts(contact)

		if (similarContacts.length > 0 && !selectedContacts.some(c => c.id === contact.id)) {
			duplicateContact = contact
			duplicateMatches = similarContacts
			showDuplicateConfirm = true
			return
		}

		const index = selectedContacts.findIndex(c => c.id === contact.id)
		if (index >= 0) {
			selectedContacts = selectedContacts.filter(c => c.id !== contact.id)
		} else {
			selectedContacts = [...selectedContacts, contact]
		}
	}

	function confirmDuplicateImport() {
		if (duplicateContact) {
			selectedContacts = [...selectedContacts, duplicateContact]
		}
		showDuplicateConfirm = false
		duplicateContact = null
		duplicateMatches = []
	}

	function cancelDuplicateImport() {
		showDuplicateConfirm = false
		duplicateContact = null
		duplicateMatches = []
	}

	function selectAllContacts() {
		const availableContacts = data.data.filter(contact => !isContactInProject(contact))
		selectedContacts = [...availableContacts]
	}

	function clearSelection() {
		selectedContacts = []
	}

	async function importSelectedContacts() {
		if (selectedContacts.length === 0) {
			alert('No contact selected')
			return
		}

		importing = true

		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/contacts/import`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contact_ids: selectedContacts.map(c => c.id).filter(id => id != null)
				})
			})

			if (response.ok) {
				importResults = await response.json()

				if (importResults && (importResults.imported.length > 0 || importResults.conflicts.length > 0)) {
					dispatch('contactsImported', importResults)
				}
			} else {
				const errorText = await response.text()
				try {
					const errorData = JSON.parse(errorText)
					alert(`Import error: ${errorData.error || 'Unknown error'}`)
				} catch {
					alert(`Import error: ${errorText}`)
				}
			}
		} catch (error) {
			alert('Error importing contacts')
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
		return contact.instruments.map(i => `${i.name} (${i.pivot_proficiency_level || 'Not specified'})`).join(', ')
	}

	function getContactProjects(contact: Contact): string {
		if (contact.projects && contact.projects.length > 0) {
			const projects = contact.projects
				.map(p => p.name)
				.filter(Boolean)
				.slice(0, 3)
			return projects.join(', ') + (contact.projects.length > 3 ? '...' : '')
		}

		if (contact.participants && contact.participants.length > 0) {
			const projects = contact.participants
				.map(p => p.project?.name)
				.filter(Boolean)
				.slice(0, 3)
			return projects.join(', ') + (contact.participants.length > 3 ? '...' : '')
		}

		return ''
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	<div class="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-y-auto">
		<!-- Header -->
		<div class="flex items-center justify-between p-6 border-b bg-gray-50">
			<div class="flex items-center gap-2">
				<Upload class="text-[#6B9AD9]" size={24} />
				<h2 class="text-xl font-semibold">Import Contacts from Database</h2>
			</div>
			<button
				on:click={closeModal}
				class="text-gray-400 hover:text-gray-600 transition-colors"
			>
				<X size={24} />
			</button>
		</div>

		<!-- Content -->
		<div class="p-6">
			{#if !importResults}
				<!-- Advanced Search -->
				<div class="space-y-6">
					{#if isLoaded && data && columns}
						<div class="bg-white rounded-lg border border-gray-200 p-4">
							<QueryBuilder
								bind:columns
								bind:options
								bind:operations
								bind:typesOfWhere
								bind:filterLevel
								bind:instrumentFamily
								bind:selectedLevelInstruments
								on:optionsUpdated={fetchData}
							/>
						</div>
					{/if}
				</div>

				<!-- Results -->
				{#if isLoaded && data}
					<div class="bg-white rounded-lg p-4 mt-6">
						<!-- Selection actions -->
						<div class="flex items-center justify-between mb-4">
							<h4 class="font-semibold text-gray-900 flex items-center gap-2">
								<Users size={20} class="text-[#6B9AD9]" />
								Available contacts ({data.data.length})
								{#if existingContacts.length > 0}
									<span class="text-sm text-gray-500">
										({data.data.filter(c => !isContactInProject(c)).length} not in project)
									</span>
								{/if}
							</h4>

							{#if data.data.length > 0}
								<div class="flex gap-2">
									<button
										on:click={selectAllContacts}
										class="px-3 py-1 text-sm bg-[#6B9AD9] text-white hover:bg-[#5a9bb4] rounded-lg font-semibold"
									>
										Select all available
									</button>
									{#if selectedContacts.length > 0}
										<button
											on:click={clearSelection}
											class="px-3 py-1 text-sm bg-red-500 text-white hover:bg-red-600 rounded-lg font-semibold"
										>
											Deselect ({selectedContacts.length})
										</button>
									{/if}
								</div>
							{/if}
						</div>

						{#if data.data.length === 0}
							<div class="text-center py-12">
								<Users size={64} class="mx-auto mb-4 opacity-30 text-gray-400" />
								<h3 class="text-lg font-medium text-gray-900">No contacts found</h3>
								<p class="text-gray-500 mt-2">
									Try modifying your search criteria or reset the filters.
								</p>
							</div>
						{:else}
							<!-- Contacts table -->
							<div class="border border-gray-200 rounded-lg overflow-hidden">
								<div class="max-h-96 overflow-y-auto">
									<table class="w-full text-sm">
										<thead class="bg-gray-50 sticky top-0">
										<tr>
											<th class="px-4 py-3 text-left w-12">
												<input
													type="checkbox"
													checked={selectedContacts.length === data.data.filter(c => !isContactInProject(c)).length && data.data.filter(c => !isContactInProject(c)).length > 0}
													on:change={(e) => e.target.checked ? selectAllContacts() : clearSelection()}
													class="rounded"
												/>
											</th>
											<th class="px-4 py-3 text-left font-semibold">Contact</th>
											<th class="px-4 py-3 text-left font-semibold">Instruments & Levels</th>
											<th class="px-4 py-3 text-left font-semibold">Past projects</th>
											<th class="px-4 py-3 text-left font-semibold">Status</th>
											<th class="px-4 py-3 text-left font-semibold">In Project</th>
										</tr>
										</thead>
										<tbody>
										{#each data.data as contact (contact.id)}
											{@const isInProject = isContactInProject(contact)}
											<tr class="border-t hover:bg-gray-50 {isInProject ? 'bg-yellow-50' : ''}">
												<td class="px-4 py-3">
													<input
														type="checkbox"
														checked={selectedContacts.some(c => c.id === contact.id)}
														on:change={() => toggleContactSelection(contact)}
														class="rounded"
														disabled={isInProject}
													/>
												</td>
												<td class="px-4 py-3">
													<div class="flex items-center space-x-3">
														<div class="w-10 h-10 bg-[#6B9AD9] rounded-full flex items-center justify-center">
															<span class="text-white font-bold text-sm">
																{(contact.firstName || contact.first_name || 'F').charAt(0)}{(contact.lastName || contact.last_name || 'L').charAt(0)}
															</span>
														</div>
														<div>
															<div class="font-medium text-gray-900">
																{contact.firstName || contact.first_name || 'First name'} {contact.lastName || contact.last_name || 'Last name'}
															</div>
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
																<div class="flex gap-2 my-1">
																	<div class="{familyToStyle(instrument.family)} font-semibold rounded-lg p-1 px-2">
																		{familyToEmoji(instrument.family)} {instrument.name}
																	</div>
																	{#if instrument.pivot_proficiency_level}
																		<div class="{levelToStyle(instrument.pivot_proficiency_level)} border-2 p-1 px-2 rounded-lg font-semibold">
																			{levelSimplificator(instrument.pivot_proficiency_level)}
																		</div>
																	{/if}
																</div>
															{/each}
														{:else}
															<span class="text-gray-400 italic">No instrument</span>
														{/if}
													</div>
												</td>
												<td class="px-4 py-3 text-sm text-gray-600">
													{getContactProjects(contact) || '-'}
												</td>
												<td class="px-4 py-3">
													<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {contact.validated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
														{contact.validated ? 'Validated' : 'Pending validation'}
													</span>
												</td>
												<td class="px-4 py-3">
													{#if isInProject}
														<div class="flex items-center gap-2">
															<CheckCircle size={16} class="text-green-500" />
															<span class="text-sm font-medium text-green-700">Already in project</span>
														</div>
													{:else}
														<div class="flex items-center gap-2">
															<X size={16} class="text-gray-400" />
															<span class="text-sm text-gray-500">Available</span>
														</div>
													{/if}
												</td>
											</tr>
										{/each}
										</tbody>
									</table>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<!-- Initial loading -->
					<div class="text-center py-12">
						<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9AD9] mx-auto mb-4"></div>
						<p class="text-gray-600">Loading contacts and filters...</p>
					</div>
				{/if}

				<!-- Import actions -->
				{#if selectedContacts.length > 0}
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
						<div class="flex items-center justify-between">
							<div>
								<h4 class="font-semibold text-blue-900">
									Ready to import {selectedContacts.length} contact(s)
								</h4>
								<p class="text-sm text-blue-700 mt-1">
									These contacts will be added to your recruitment list with "Not yet contacted" status.
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
								{importing ? 'Importing...' : 'Import contacts'}
							</button>
						</div>
					</div>
				{/if}

			{:else}
				<!-- Import results -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold text-gray-900">Import results</h3>

					<!-- Success -->
					{#if importResults.imported.length > 0}
						<div class="bg-green-50 border border-green-200 rounded-lg p-4">
							<div class="flex items-start gap-2">
								<CheckCircle class="text-green-500 mt-0.5 flex-shrink-0" size={20} />
								<div>
									<h4 class="font-semibold text-green-900">
										{importResults.imported.length} contact(s) imported successfully
									</h4>
									<div class="mt-2 max-h-32 overflow-y-auto">
										{#each importResults.imported as contact}
											<p class="text-sm text-green-800">
												{contact.first_name} {contact.last_name}
											</p>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Conflicts -->
					{#if importResults.conflicts.length > 0}
						<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
							<div class="flex items-start gap-2">
								<AlertTriangle class="text-yellow-500 mt-0.5 flex-shrink-0" size={20} />
								<div>
									<h4 class="font-semibold text-yellow-900">
										{importResults.conflicts.length} conflict(s) detected
									</h4>
									<p class="text-sm text-yellow-800 mt-1">
										These contacts are already in your recruitment list:
									</p>
									<div class="mt-2 max-h-32 overflow-y-auto">
										{#each importResults.conflicts as conflict}
											<p class="text-sm text-yellow-800">
												{conflict.contact.firstName} {conflict.contact.lastName}
												(current status: {conflict.existing_status})
											</p>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Errors -->
					{#if importResults.errors.length > 0}
						<div class="bg-red-50 border border-red-200 rounded-lg p-4">
							<div class="flex items-start gap-2">
								<AlertTriangle class="text-red-500 mt-0.5 flex-shrink-0" size={20} />
								<div>
									<h4 class="font-semibold text-red-900">
										{importResults.errors.length} error(s)
									</h4>
									<div class="mt-2 max-h-32 overflow-y-auto">
										{#each importResults.errors as error}
											<p class="text-sm text-red-800">{error}</p>
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
				{importResults ? 'Close' : 'Cancel'}
			</button>

			{#if importResults}
				<button
					type="button"
					on:click={resetImport}
					class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4]"
				>
					New import
				</button>
			{/if}
		</div>
	</div>
</div>

<!-- Modal de confirmation de doublon -->
{#if showDuplicateConfirm}
	<div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
		<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
			<div class="flex items-center justify-between p-6 border-b bg-red-50">
				<div class="flex items-center gap-3">
					<AlertTriangle class="text-red-500" size={24} />
					<h3 class="text-lg font-semibold text-red-800">Potential Duplicate Detected</h3>
				</div>
			</div>

			<div class="p-6">
				<div class="mb-4">
					<h4 class="font-medium text-gray-900 mb-2">Contact to import:</h4>
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
						<p class="font-semibold">
							{duplicateContact?.firstName || duplicateContact?.first_name} {duplicateContact?.lastName || duplicateContact?.last_name}
						</p>
						{#if duplicateContact?.email}
							<p class="text-sm text-gray-600">{duplicateContact.email}</p>
						{/if}
					</div>
				</div>

				<div class="mb-6">
					<h4 class="font-medium text-gray-900 mb-2">Similar contacts already in project:</h4>
					<div class="space-y-2">
						{#each duplicateMatches as match}
							<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
								<p class="font-semibold">{match.first_name} {match.last_name}</p>
								{#if match.email}
									<p class="text-sm text-gray-600">{match.email}</p>
								{/if}
								<p class="text-xs text-yellow-700">Status: {match.status}</p>
								{#if match.source}
									<p class="text-xs text-gray-500">Source: {match.source}</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
					<p class="text-sm text-red-700">
						<strong>Warning:</strong> This contact appears to be similar to existing contacts in your recruitment list.
						Importing duplicates may cause confusion in your recruitment process.
					</p>
				</div>

				<p class="text-gray-600 mb-6">
					Do you want to import this contact anyway?
				</p>
			</div>

			<div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
				<button
					type="button"
					on:click={cancelDuplicateImport}
					class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					type="button"
					on:click={confirmDuplicateImport}
					class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
				>
					Import anyway
				</button>
			</div>
		</div>
	</div>
{/if}