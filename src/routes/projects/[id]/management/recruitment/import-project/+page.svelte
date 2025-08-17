<script lang="ts">
	import { page } from '$app/stores'
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { ArrowLeft, Upload, Users, AlertTriangle, CheckCircle, Copy, Filter, Calendar } from 'lucide-svelte'
	import type { Project } from '$lib/types'

	let projects: Project[] = []
	let loading = true
	let importing = false
	let selectedProjectId: number | null = null
	let selectedStatuses: string[] = ['not_yet_contacted', 'awaiting_response', 'to_follow_up']

	let importResults: {
		imported: any[]
		conflicts: any[]
		errors: string[]
	} | null = null

	$: projectId = $page.params.id

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

	async function importFromProject() {
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
					include_statuses: selectedStatuses
				})
			})

			if (response.ok) {
				importResults = await response.json()
			} else {
				alert('Import error')
			}
		} catch (error) {
			console.error('Error importing:', error)
			alert('Import error')
		} finally {
			importing = false
		}
	}

	function goBack() {
		goto(`/projects/${projectId}/management/recruitment`)
	}

	function resetImport() {
		importResults = null
		selectedProjectId = null
		selectedStatuses = ['not_yet_contacted', 'awaiting_response', 'to_follow_up']
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	}

	$: selectedProject = projects.find(p => p.id === selectedProjectId)
</script>

<svelte:head>
	<title>Import from Project - Recruitment</title>
</svelte:head>

<div class="min-h-screen bg-[#E7E7E7] p-4">
	<div class="max-w-5xl mx-auto">
		<!-- Header -->
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6 mb-6">
			<div class="flex items-center gap-4 mb-4">
				<button
					on:click={goBack}
					class="flex items-center justify-center w-10 h-10 bg-[#6B9AD9] rounded-[8px] text-white hover:bg-[#5a9bb4] transition-colors"
					title="Back to recruitment"
				>
					<ArrowLeft size={20} />
				</button>
				<div class="flex-1">
					<h1 class="font-bold text-2xl uppercase text-gray-900">Import from Another Project</h1>
					<p class="text-gray-600 mt-1">Copy recruitment contacts from an existing project</p>
				</div>
				<div class="flex items-center justify-center w-12 h-12 bg-[#6B9AD9] rounded-[8px]">
					<Copy class="text-white" size={24} />
				</div>
			</div>
		</div>

		{#if loading}
			<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-8 text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9AD9] mx-auto mb-4"></div>
				<p class="text-gray-600">Loading projects...</p>
			</div>
		{:else if !importResults}
			<!-- Import form -->
			<div class="space-y-6">
				<!-- Source project selection -->
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
					<div class="flex items-center space-x-3 mb-6">
						<div class="flex items-center justify-center w-10 h-10 bg-[#6B9AD9] rounded-[8px]">
							<Users class="text-white" size={20} />
						</div>
						<div>
							<h2 class="font-bold text-lg uppercase">Source Project</h2>
							<p class="text-sm text-gray-600">Select the project to import contacts from</p>
						</div>
					</div>

					{#if projects.length === 0}
						<div class="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-[8px]">
							<Users size={48} class="mx-auto mb-4 opacity-30 text-gray-400" />
							<h3 class="text-lg font-medium text-gray-900 mb-2">No Projects Available</h3>
							<p class="text-gray-500">No other projects are available for import.</p>
						</div>
					{:else}
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each projects as project}
								<div class="border-2 rounded-[8px] p-4 cursor-pointer transition-all hover:shadow-md {selectedProjectId === project.id ? 'border-[#6B9AD9] bg-blue-50' : 'border-gray-300 hover:border-[#6B9AD9]'}"
										 on:click={() => selectedProjectId = project.id}
								>
									<input
										type="radio"
										bind:group={selectedProjectId}
										value={project.id}
										class="sr-only"
									/>
									<div class="flex items-start justify-between mb-3">
										<div class="w-8 h-8 bg-[#6B9AD9] rounded-[6px] flex items-center justify-center flex-shrink-0">
											<span class="text-white font-bold text-sm">
												{project.name.charAt(0).toUpperCase()}
											</span>
										</div>
										{#if selectedProjectId === project.id}
											<div class="w-6 h-6 bg-[#6B9AD9] rounded-full flex items-center justify-center">
												<CheckCircle size={16} class="text-white" />
											</div>
										{/if}
									</div>
									<h3 class="font-bold text-gray-900 mb-2 leading-tight">{project.name}</h3>
									<div class="flex items-center text-xs text-gray-500">
										<Calendar size={12} class="mr-1" />
										<span>Created {formatDate(project.createdAt)}</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Status selection -->
				{#if selectedProjectId}
					<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
						<div class="flex items-center justify-between mb-6">
							<div class="flex items-center space-x-3">
								<div class="flex items-center justify-center w-10 h-10 bg-[#6B9AD9] rounded-[8px]">
									<Filter class="text-white" size={20} />
								</div>
								<div>
									<h2 class="font-bold text-lg uppercase">Statuses to Import</h2>
									<p class="text-sm text-gray-600">Select which contact statuses to include</p>
								</div>
							</div>
							<div class="flex gap-2">
								<button
									on:click={selectAllStatuses}
									class="px-3 py-1 text-sm bg-[#6B9AD9] text-white rounded-[6px] hover:bg-[#5a9bb4] font-semibold"
								>
									Select All
								</button>
								<button
									on:click={clearAllStatuses}
									class="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-[6px] hover:bg-gray-300 font-semibold"
								>
									Clear All
								</button>
							</div>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
							{#each statusOptions as option}
								<label class="group flex items-center gap-3 p-4 border-2 rounded-[8px] cursor-pointer transition-all {selectedStatuses.includes(option.value) ? 'border-[#6B9AD9] bg-blue-50' : 'border-gray-300 hover:border-[#6B9AD9] hover:bg-gray-50'}">
									<input
										type="checkbox"
										checked={selectedStatuses.includes(option.value)}
										on:change={() => toggleStatus(option.value)}
										class="w-4 h-4 text-[#6B9AD9] border-gray-300 rounded focus:ring-[#6B9AD9]"
									/>
									<div class="flex-1">
										<div class="flex items-center gap-2 mb-1">
											<span class="inline-block w-3 h-3 rounded-full {option.bgColor}"></span>
											<span class="font-semibold text-gray-900">{option.label}</span>
										</div>
										<span class="text-xs {option.color}">Status indicator</span>
									</div>
								</label>
							{/each}
						</div>

						{#if selectedStatuses.length === 0}
							<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-[8px]">
								<p class="text-sm text-red-700 font-medium">
									Please select at least one status.
								</p>
							</div>
						{/if}
					</div>

					<!-- Selected project info -->
					{#if selectedProject}
						<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
							<div class="flex items-center space-x-3 mb-4">
								<div class="flex items-center justify-center w-10 h-10 bg-[#6B9AD9] rounded-[8px]">
									<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
									</svg>
								</div>
								<div>
									<h2 class="font-bold text-lg uppercase">Import Summary</h2>
									<p class="text-sm text-gray-600">Review your import settings</p>
								</div>
							</div>

							<div class="bg-gray-50 border-2 border-gray-200 rounded-[8px] p-4 space-y-3">
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
											<span class="inline-flex items-center px-2 py-1 rounded-[4px] text-xs font-medium {statusConfig?.bgColor} {statusConfig?.color}">
												{statusConfig?.label}
											</span>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{/if}



					<!-- Import button -->
					<div class="text-center">
						<button
							on:click={importFromProject}
							disabled={importing || selectedStatuses.length === 0}
							class="px-8 py-4 bg-[#6B9AD9] text-white rounded-[10px] hover:bg-[#5a9bb4] disabled:opacity-50 transition-colors flex items-center gap-3 mx-auto font-bold text-lg"
						>
							{#if importing}
								<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
							{:else}
								<Upload size={24} />
							{/if}
							{importing ? 'Importing contacts...' : 'Import Contacts'}
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Import results -->
			<div class="space-y-6">
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
					<div class="flex items-center space-x-3 mb-6">
						<div class="flex items-center justify-center w-10 h-10 bg-[#6B9AD9] rounded-[8px]">
							<CheckCircle class="text-white" size={20} />
						</div>
						<div>
							<h2 class="font-bold text-xl uppercase">Import Results</h2>
							<p class="text-gray-600">Summary of the import operation</p>
						</div>
					</div>

					<!-- Success -->
					{#if importResults.imported.length > 0}
						<div class="bg-green-50 border-2 border-green-200 rounded-[8px] p-4 mb-4">
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

					<!-- Conflicts -->
					{#if importResults.conflicts.length > 0}
						<div class="bg-yellow-50 border-2 border-yellow-200 rounded-[8px] p-4 mb-4">
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
						<div class="bg-red-50 border-2 border-red-200 rounded-[8px] p-4 mb-4">
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

					<!-- Action buttons -->
					<div class="flex justify-center gap-4 mt-8">
						<button
							on:click={goBack}
							class="px-6 py-3 bg-[#6B9AD9] text-white rounded-[8px] hover:bg-[#5a9bb4] transition-colors font-semibold flex items-center gap-2"
						>
							<ArrowLeft size={16} />
							Back to Recruitment
						</button>
						<button
							on:click={resetImport}
							class="px-6 py-3 bg-gray-200 text-gray-800 rounded-[8px] hover:bg-gray-300 transition-colors font-semibold flex items-center gap-2"
						>
							<Upload size={16} />
							New Import
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>