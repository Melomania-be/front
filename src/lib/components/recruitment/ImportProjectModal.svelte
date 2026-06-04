<!-- src/lib/components/recruitment/ImportProjectModal.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import { X, Users, Upload, AlertTriangle, CheckCircle, Copy, Filter, Calendar } from 'lucide-svelte'
	import type { Project } from '$lib/types'

	export let projectId: string

	const dispatch = createEventDispatcher()

	let projects: Project[] = []
	let loading = true
	let importing = false
	let selectedProjectId: number | null = null
	let selectedStatuses: string[] = ['not_yet_contacted', 'awaiting_response', 'to_follow_up']

	let importResults: {
		imported: any[]
		replaced?: any[]
		conflicts: any[]
		errors: string[]
	} | null = null
	let showDuplicateWarning = false
	let duplicateWarnings: any[] = []
	let duplicateWarningSource: 'server' | 'server_exact' | null = null

	const statusOptions = [
		{ value: 'not_yet_contacted', label: 'Not yet contacted', color: 'text-gray-700', bgColor: 'bg-gray-100' },
		{ value: 'awaiting_response', label: 'Awaiting response', color: 'text-blue-700', bgColor: 'bg-blue-100' },
		{ value: 'to_follow_up', label: 'Follow up', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
		{ value: 'not_available', label: 'Not available', color: 'text-red-700', bgColor: 'bg-red-100' },
		{ value: 'pending_validation', label: 'Pending validation', color: 'text-purple-700', bgColor: 'bg-purple-100' },
		{ value: 'cancelled', label: 'Cancelled', color: 'text-gray-500', bgColor: 'bg-gray-100' },
		{ value: 'recruited', label: 'Recruited', color: 'text-green-700', bgColor: 'bg-green-100' }
	]

	onMount(async () => {
		await fetchProjects()
		loading = false
	})

	async function fetchProjects() {
		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/import-project`)
			if (response.ok) {
				projects = await response.json()
			}
		} catch (error) {
			console.error('Error fetching projects:', error)
		}
	}

	function toggleStatus(status: string) {
		if (selectedStatuses.includes(status)) {
			selectedStatuses = selectedStatuses.filter(s => s !== status)
		} else {
			selectedStatuses = [...selectedStatuses, status]
		}
	}

	function selectAllStatuses() {
		selectedStatuses = statusOptions.map(s => s.value)
	}

	function clearAllStatuses() {
		selectedStatuses = []
	}

	function normalizePhone(value: string | null | undefined): string {
		return (value || '').replace(/\s|\/|\.|-/g, '').trim()
	}

	function normalizeMessenger(value: string | null | undefined): string {
		return (value || '').toLowerCase().trim()
	}

	function hasIdenticalCommunicationDetails(first: any, second: any): boolean {
		return (
			((first?.email || '').toLowerCase().trim() === (second?.email || '').toLowerCase().trim()) &&
			(normalizePhone(first?.phone) === normalizePhone(second?.phone)) &&
			(normalizeMessenger(first?.messenger) === normalizeMessenger(second?.messenger))
		)
	}

	function hasExactWarningMatch(warning: any): boolean {
		const warningContact = warning?.contact || {}
		const warningFirstName = (warningContact.first_name || '').toLowerCase().trim()
		const warningLastName = (warningContact.last_name || '').toLowerCase().trim()

		return (warning?.matches || []).some((match: any) => {
			const matchContact = match.contact || match
			const matchFirstName = (matchContact.first_name || '').toLowerCase().trim()
			const matchLastName = (matchContact.last_name || '').toLowerCase().trim()
			const sameName = warningFirstName === matchFirstName && warningLastName === matchLastName

			return sameName && hasIdenticalCommunicationDetails(warningContact, matchContact) && match?.type === 'exact_contact'
		})
	}

	function hasAnyExactMatches(): boolean {
		return duplicateWarnings.some((warning) => hasExactWarningMatch(warning))
	}

	async function importFromProject(allowDuplicateName = false, replaceExisting = false) {
		if (!selectedProjectId || selectedStatuses.length === 0) {
			alert('Please select a project and at least one status')
			return
		}

		importing = true

		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/import-project`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					source_project_id: selectedProjectId,
					include_statuses: selectedStatuses,
					allow_duplicate_name: allowDuplicateName,
					replace_existing: replaceExisting
				})
			})

			if (response.ok) {
				importResults = await response.json()
			} else {
				const errorData = await response.json().catch(() => ({ error: 'Import error' }))
				if (response.status === 409 || errorData.code === 'POTENTIAL_DUPLICATE_RECRUITMENT_CONTACT' || errorData.code === 'EXACT_RECRUITMENT_CONTACT_ALREADY_EXISTS' || Array.isArray(errorData.duplicate_warnings)) {
					duplicateWarnings = errorData.duplicate_warnings || []
					duplicateWarningSource = hasAnyExactMatches() ? 'server_exact' : 'server'
					showDuplicateWarning = true
					return
				}
				alert(errorData.error || 'Import error')
			}
		} catch (error) {
			console.error('Error importing:', error)
			alert('Import error')
		} finally {
			importing = false
		}
	}

	function cancelDuplicateWarning() {
		showDuplicateWarning = false
		duplicateWarnings = []
		duplicateWarningSource = null
	}

	async function confirmDuplicateWarning() {
		showDuplicateWarning = false
		duplicateWarnings = []
		duplicateWarningSource = null
		await importFromProject(true, false)
	}

	function closeModal() {
		dispatch('close')
	}

	function resetImport() {
		importResults = null
		cancelDuplicateWarning()
		selectedProjectId = null
		selectedStatuses = ['not_yet_contacted', 'awaiting_response', 'to_follow_up']
	}

	function completeImport() {
		dispatch('projectsImported', importResults)
		closeModal()
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !importing) {
			closeModal()
		}
	}

	$: selectedProject = projects.find(p => p.id === selectedProjectId)
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
	<div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
		<!-- Header -->
		<div class="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
			<div class="flex items-center gap-3">
				<div class="flex items-center justify-center w-10 h-10 bg-[#6B9AD9] rounded-[8px]">
					<Copy class="text-white" size={20} />
				</div>
				<div>
					<h2 class="text-xl font-bold uppercase">Import from Another Project</h2>
					<p class="text-sm text-gray-600">Copy recruitment contacts from an existing project</p>
				</div>
			</div>
			<button
				on:click={closeModal}
				class="text-gray-400 hover:text-gray-600 transition-colors"
				disabled={importing}
			>
				<X size={24} />
			</button>
		</div>

		<div class="p-6">
			{#if loading}
				<div class="text-center py-12">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9AD9] mx-auto mb-4"></div>
					<p class="text-gray-600">Loading projects...</p>
				</div>
			{:else if !importResults}
				<!-- Import form -->
				<div class="space-y-6">
					<!-- Source project selection -->
					<div>
						<div class="flex items-center space-x-3 mb-4">
							<div class="flex items-center justify-center w-8 h-8 bg-[#6B9AD9] rounded-[6px]">
								<Users class="text-white" size={18} />
							</div>
							<div>
								<h3 class="font-bold text-base uppercase">Source Project</h3>
								<p class="text-xs text-gray-600">Select the project to import contacts from</p>
							</div>
						</div>

						{#if projects.length === 0}
							<div class="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-[8px]">
								<Users size={40} class="mx-auto mb-3 opacity-30 text-gray-400" />
								<h4 class="text-base font-medium text-gray-900 mb-1">No Projects Available</h4>
								<p class="text-sm text-gray-500">No other projects are available for import.</p>
							</div>
						{:else}
							<div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
								{#each projects as project}
									<div
										class="border-2 rounded-[8px] p-3 cursor-pointer transition-all hover:shadow-md {selectedProjectId === project.id ? 'border-[#6B9AD9] bg-blue-50' : 'border-gray-300 hover:border-[#6B9AD9]'}"
										on:click={() => selectedProjectId = project.id}
									>
										<input
											type="radio"
											bind:group={selectedProjectId}
											value={project.id}
											class="sr-only"
										/>
										<div class="flex items-start justify-between mb-2">
											<div class="w-7 h-7 bg-[#6B9AD9] rounded-[6px] flex items-center justify-center flex-shrink-0">
												<span class="text-white font-bold text-xs">
													{project.name.charAt(0).toUpperCase()}
												</span>
											</div>
											{#if selectedProjectId === project.id}
												<div class="w-5 h-5 bg-[#6B9AD9] rounded-full flex items-center justify-center">
													<CheckCircle size={14} class="text-white" />
												</div>
											{/if}
										</div>
										<h4 class="font-bold text-gray-900 mb-1 text-sm leading-tight">{project.name}</h4>
										<div class="flex items-center text-xs text-gray-500">
											<Calendar size={10} class="mr-1" />
											<span>Created {formatDate(project.createdAt)}</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Status selection -->
					{#if selectedProjectId}
						<div>
							<div class="flex items-center justify-between mb-4">
								<div class="flex items-center space-x-3">
									<div class="flex items-center justify-center w-8 h-8 bg-[#6B9AD9] rounded-[6px]">
										<Filter class="text-white" size={18} />
									</div>
									<div>
										<h3 class="font-bold text-base uppercase">Statuses to Import</h3>
										<p class="text-xs text-gray-600">Select which contact statuses to include</p>
									</div>
								</div>
								<div class="flex gap-2">
									<button
										on:click={selectAllStatuses}
										class="px-2 py-1 text-xs bg-[#6B9AD9] text-white rounded-[6px] hover:bg-[#5a9bb4] font-semibold"
									>
										Select All
									</button>
									<button
										on:click={clearAllStatuses}
										class="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-[6px] hover:bg-gray-300 font-semibold"
									>
										Clear
									</button>
								</div>
							</div>

							<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
								{#each statusOptions as option}
									<label class="flex items-center gap-2 p-3 border-2 rounded-[6px] cursor-pointer transition-all {selectedStatuses.includes(option.value) ? 'border-[#6B9AD9] bg-blue-50' : 'border-gray-300 hover:border-[#6B9AD9] hover:bg-gray-50'}">
										<input
											type="checkbox"
											checked={selectedStatuses.includes(option.value)}
											on:change={() => toggleStatus(option.value)}
											class="w-4 h-4 text-[#6B9AD9] border-gray-300 rounded focus:ring-[#6B9AD9]"
										/>
										<div class="flex-1">
											<div class="flex items-center gap-2">
												<span class="inline-block w-2 h-2 rounded-full {option.bgColor}"></span>
												<span class="font-semibold text-sm text-gray-900">{option.label}</span>
											</div>
										</div>
									</label>
								{/each}
							</div>

							{#if selectedStatuses.length === 0}
								<div class="mt-3 p-2 bg-red-50 border border-red-200 rounded-[6px]">
									<p class="text-xs text-red-700 font-medium">
										Please select at least one status.
									</p>
								</div>
							{/if}
						</div>

						<!-- Selected project info -->
						{#if selectedProject}
							<div class="bg-gray-50 border-2 border-gray-200 rounded-[8px] p-4">
								<h4 class="font-bold text-sm uppercase mb-3 text-gray-900">Import Summary</h4>
								<div class="space-y-2 text-sm">
									<div class="flex justify-between">
										<span class="font-medium text-gray-700">Source Project:</span>
										<span class="font-bold text-gray-900">{selectedProject.name}</span>
									</div>
									<div class="flex justify-between">
										<span class="font-medium text-gray-700">Selected Statuses:</span>
										<span class="font-bold text-gray-900">{selectedStatuses.length} status(es)</span>
									</div>
									<div class="pt-2 border-t border-gray-300">
										<div class="flex flex-wrap gap-1">
											{#each selectedStatuses as status}
												{@const statusConfig = statusOptions.find(s => s.value === status)}
												<span class="inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium {statusConfig?.bgColor} {statusConfig?.color}">
													{statusConfig?.label}
												</span>
											{/each}
										</div>
									</div>
								</div>
							</div>
						{/if}
					{/if}
				</div>
			{:else}
				<!-- Import results -->
				<div class="space-y-4">
					<!-- Success -->
					{#if importResults.imported.length > 0}
						<div class="bg-green-50 border-2 border-green-200 rounded-[8px] p-4">
							<div class="flex items-start gap-3">
								<CheckCircle class="text-green-500 mt-0.5 flex-shrink-0" size={20} />
								<div class="flex-1">
									<h4 class="font-bold text-green-900 mb-2">
										{importResults.imported.length} contact(s) imported successfully
									</h4>
									<div class="max-h-32 overflow-y-auto space-y-1">
										{#each importResults.imported as contact}
											<div class="flex items-center gap-2 text-sm text-green-800">
												<div class="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
												<span class="font-medium">{contact.first_name} {contact.last_name}</span>
											</div>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{/if}

					{#if (importResults.replaced || []).length > 0}
						<div class="bg-blue-50 border-2 border-blue-200 rounded-[8px] p-4">
							<div class="flex items-start gap-3">
								<CheckCircle class="text-blue-500 mt-0.5 flex-shrink-0" size={20} />
								<div class="flex-1">
									<h4 class="font-bold text-blue-900 mb-2">
										{(importResults.replaced || []).length} existing contact(s) replaced
									</h4>
									<div class="max-h-32 overflow-y-auto space-y-1">
										{#each (importResults.replaced || []) as contact}
											<div class="flex items-center gap-2 text-sm text-blue-800">
												<div class="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
												<span class="font-medium">{contact.first_name} {contact.last_name}</span>
											</div>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Conflicts -->
					{#if importResults.conflicts.length > 0}
						<div class="bg-yellow-50 border-2 border-yellow-200 rounded-[8px] p-4">
							<div class="flex items-start gap-3">
								<AlertTriangle class="text-yellow-500 mt-0.5 flex-shrink-0" size={20} />
								<div class="flex-1">
									<h4 class="font-bold text-yellow-900 mb-2">
										{importResults.conflicts.length} conflict(s) detected
									</h4>
									<p class="text-sm text-yellow-800 mb-3">
										These contacts already exist in this project:
									</p>
									<div class="max-h-32 overflow-y-auto space-y-1">
										{#each importResults.conflicts as conflict}
											<div class="flex items-center gap-2 text-sm text-yellow-800">
												<div class="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
												<span class="font-medium">{conflict.source_contact.first_name} {conflict.source_contact.last_name}</span>
												<span class="text-xs opacity-75">(already exists)</span>
											</div>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Errors -->
					{#if importResults.errors.length > 0}
						<div class="bg-red-50 border-2 border-red-200 rounded-[8px] p-4">
							<div class="flex items-start gap-3">
								<AlertTriangle class="text-red-500 mt-0.5 flex-shrink-0" size={20} />
								<div class="flex-1">
									<h4 class="font-bold text-red-900 mb-2">
										{importResults.errors.length} error(s) occurred
									</h4>
									<div class="max-h-32 overflow-y-auto space-y-1">
										{#each importResults.errors as error}
											<div class="flex items-center gap-2 text-sm text-red-800">
												<div class="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
												<span>{error}</span>
											</div>
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
		<div class="flex justify-end gap-3 p-6 border-t bg-gray-50 sticky bottom-0">
			{#if !importResults}
				<button
					type="button"
					on:click={closeModal}
					disabled={importing}
					class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="button"
					on:click={() => importFromProject()}
					disabled={importing || !selectedProjectId || selectedStatuses.length === 0}
					class="px-6 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] disabled:opacity-50 flex items-center gap-2 font-semibold"
				>
					{#if importing}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
					{:else}
						<Upload size={18} />
					{/if}
					{importing ? 'Importing...' : 'Import Contacts'}
				</button>
			{:else}
				<button
					type="button"
					on:click={resetImport}
					class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					New Import
				</button>
				<button
					type="button"
					on:click={completeImport}
					class="px-6 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] flex items-center gap-2 font-semibold"
				>
					<CheckCircle size={18} />
					Done
				</button>
			{/if}
		</div>
	</div>
</div>

{#if showDuplicateWarning}
	<div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
		<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
			<div class="flex items-center gap-3 p-6 border-b bg-yellow-50">
				<AlertTriangle class="text-yellow-500" size={24} />
				<h3 class="text-lg font-semibold text-yellow-900">Import conflicts detected</h3>
			</div>

			<div class="p-6 space-y-5">
				<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<p class="text-sm text-yellow-800 font-semibold mb-2">Duplicate or similar contact detected</p>
					<p class="text-sm text-yellow-700">
						One or more selected contacts look similar to contacts already in this recruitment list. You can import them anyway as separate entries.
					</p>
				</div>

				<div class="space-y-3">
					{#each duplicateWarnings as warning}
						<div class="border rounded-lg p-3 bg-yellow-50 border-yellow-200">
							<div class="flex items-start gap-2">
								<div class="flex-1">
									<p class="font-semibold text-gray-900">
										{warning.contact?.first_name} {warning.contact?.last_name}
									</p>
									{#if warning.contact?.email}
										<p class="text-xs text-gray-600 mt-1">Email: {warning.contact.email}</p>
									{/if}
									{#if warning.contact?.phone}
										<p class="text-xs text-gray-600">Phone: {warning.contact.phone}</p>
									{/if}
									{#if warning.contact?.messenger}
										<p class="text-xs text-gray-600">Messenger: {warning.contact.messenger}</p>
									{/if}
									{#if (warning.matches?.length || 0) > 0}
										<div class="mt-2 pt-2 border-t border-gray-300">
											<p class="text-xs font-semibold text-gray-700 mb-1">Existing contact(s):</p>
											<div class="space-y-1">
												{#each (warning.matches || []).slice(0, 3) as match}
													{@const matchContact = match.contact || match}
													<div class="text-xs text-gray-600">
														<p><strong>{matchContact.first_name} {matchContact.last_name}</strong></p>
														{#if matchContact.email}
															<p class="text-gray-500">Email: {matchContact.email}</p>
														{/if}
														{#if matchContact.phone}
															<p class="text-gray-500">Phone: {matchContact.phone}</p>
														{/if}
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
				<button
						type="button"
						on:click={cancelDuplicateWarning}
						class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						type="button"
						on:click={confirmDuplicateWarning}
						disabled={importing}
						class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
					>
						{importing ? 'Importing...' : 'Import anyway'}
					</button>
			</div>
		</div>
	</div>
{/if}
