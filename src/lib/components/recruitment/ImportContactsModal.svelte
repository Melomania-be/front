<!-- src/lib/components/recruitment/ImportContactsModal.svelte -->
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
	let initialLoadPerformed = false

	let importResults: {
		imported: any[]
		conflicts: any[]
		errors: string[]
	} | null = null

	onMount(async () => {
		await loadInitialContacts()
	})

	async function loadInitialContacts() {
		if (initialLoadPerformed) return

		searching = true
		initialLoadPerformed = true

		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/search-contacts`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					filter: '',
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
			}
		} catch (error) {
			console.error('Error loading initial contacts:', error)
		} finally {
			searching = false
		}
	}

	async function searchContacts() {
		if (!searchQuery.trim()) {
			await loadInitialContacts()
			return
		}

		searching = true
		searchPerformed = true

		try {
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
			}
		} catch (error) {
			console.error('Error searching contacts:', error)
			alert('Error searching contacts')
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
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/contacts/import`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contact_ids: selectedContacts.map(c => c.id)
				})
			})

			if (response.ok) {
				importResults = await response.json()

				if (importResults && importResults.imported.length > 0) {
					dispatch('contactsImported', importResults)
				}
			} else {
				alert('Error importing contacts')
			}
		} catch (error) {
			console.error('Error importing contacts:', error)
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
		} else if (event.key === 'Enter' && event.target?.tagName !== 'BUTTON') {
			searchContacts()
		}
	}

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
				<h2 class="text-xl font-semibold">Import Contacts</h2>
			</div>
			<button
				on:click={closeModal}
				class="text-gray-400 hover:text-gray-600 transition-colors"
			>
				<X size={24} />
			</button>
		</div>

		<!-- Content -->
		<div class="p-6 space-y-6">
			{#if !importResults}
				<!-- Search -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold text-gray-900">Search contacts</h3>
					<p class="text-sm text-gray-600">
						All contacts are displayed by default. Use search to filter by name, email, instrument or project.
					</p>

					<div class="flex gap-2">
						<div class="flex-1 relative">
							<Search class="absolute left-3 top-3 text-gray-400" size={16} />
							<input
								type="text"
								bind:value={searchQuery}
								placeholder="Filter contacts (optional)..."
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
							{searching ? 'Searching...' : 'Filter'}
						</button>

						{#if searchQuery}
							<button
								on:click={resetSearch}
								class="px-4 py-2 text-gray-600 hover:text-gray-800"
							>
								Reset
							</button>
						{/if}
					</div>
				</div>

				{#if searching && !searchPerformed}
					<div class="text-center py-8">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B9AD9] mx-auto mb-4"></div>
						<p class="text-gray-600">Loading contacts...</p>
					</div>
				{:else}
					<!-- Results -->
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<h4 class="font-semibold text-gray-900">
								Available contacts ({searchResults.length})
							</h4>

							{#if searchResults.length > 0}
								<div class="flex gap-2">
									<button
										on:click={selectAllSearchResults}
										class="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
									>
										Select all
									</button>
									{#if selectedContacts.length > 0}
										<button
											on:click={clearSelection}
											class="px-3 py-1 text-sm bg-red-200 hover:bg-red-300 rounded"
										>
											Deselect ({selectedContacts.length})
										</button>
									{/if}
								</div>
							{/if}
						</div>

						{#if searchResults.length === 0}
							<div class="text-center py-8 text-gray-500">
								<Users size={48} class="mx-auto mb-4 opacity-50" />
								{#if searchQuery}
									<p>No contacts found for this search.</p>
									<p class="text-sm">Try different search terms.</p>
								{:else}
									<p>No contacts available in the database.</p>
								{/if}
							</div>
						{:else}
							<!-- Contact table -->
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
											<th class="px-4 py-3 text-left font-semibold">Past projects</th>
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

				<!-- Import actions -->
				{#if selectedContacts.length > 0}
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
								class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
							>
								{#if importing}
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
								{/if}
								{importing ? 'Importing...' : 'Import'}
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
									<div class="mt-2 space-y-1">
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
									<div class="mt-2 space-y-1">
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
									<div class="mt-2 space-y-1">
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
					on:click={resetSearch}
					class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4]"
				>
					New import
				</button>
			{/if}
		</div>
	</div>
</div>