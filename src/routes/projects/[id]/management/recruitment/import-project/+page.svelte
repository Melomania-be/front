// src/routes/projects/[id]/recruitment/import-project/+page.svelte
<script lang="ts">
	import { page } from '$app/stores'
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { ArrowLeft, Upload, Users, AlertTriangle, CheckCircle } from 'lucide-svelte'
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
		{ value: 'not_yet_contacted', label: 'Pas encore contacté' },
		{ value: 'awaiting_response', label: 'En attente de réponse' },
		{ value: 'to_follow_up', label: 'À relancer' },
		{ value: 'not_available', label: 'Non disponible' },
		{ value: 'pending_validation', label: 'En validation' },
		{ value: 'cancelled', label: 'Annulé' },
		{ value: 'recruited', label: 'Recruté' }
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

	async function importFromProject() {
		if (!selectedProjectId || selectedStatuses.length === 0) {
			alert('Veuillez sélectionner un projet et au moins un statut')
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
				alert('Erreur lors de l\'importation')
			}
		} catch (error) {
			console.error('Error importing:', error)
			alert('Erreur lors de l\'importation')
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
</script>

<svelte:head>
	<title>Importer depuis un projet - Recrutement</title>
</svelte:head>

<div class="min-h-screen bg-[#E7E7E7] p-4">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-lg p-6 mb-6">
			<div class="flex items-center gap-4 mb-4">
				<button
					on:click={goBack}
					class="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
				>
					<ArrowLeft size={20} />
				</button>
				<div>
					<h1 class="text-2xl font-bold text-gray-800">Importer depuis un autre projet</h1>
					<p class="text-gray-600">Copiez les contacts de recrutement d'un projet existant</p>
				</div>
			</div>
		</div>

		{#if loading}
			<div class="bg-white rounded-lg shadow-lg p-8 text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9AD9] mx-auto mb-4"></div>
				<p class="text-gray-600">Chargement des projets...</p>
			</div>
		{:else if !importResults}
			<!-- Formulaire d'import -->
			<div class="space-y-6">
				<!-- Sélection du projet source -->
				<div class="bg-white rounded-lg shadow-lg p-6">
					<h2 class="text-lg font-semibold text-gray-800 mb-4">Projet source</h2>

					{#if projects.length === 0}
						<div class="text-center py-8 text-gray-500">
							<Users size={48} class="mx-auto mb-4 opacity-50" />
							<p>Aucun autre projet disponible pour l'import.</p>
						</div>
					{:else}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							{#each projects as project}
								<div class="border rounded-lg p-4 cursor-pointer transition-colors {selectedProjectId === project.id ? 'border-[#6B9AD9] bg-blue-50' : 'border-gray-300 hover:border-gray-400'}"
										 on:click={() => selectedProjectId = project.id}
								>
									<input
										type="radio"
										bind:group={selectedProjectId}
										value={project.id}
										class="sr-only"
									/>
									<h3 class="font-semibold text-gray-800">{project.name}</h3>
									<p class="text-sm text-gray-600">
										Créé le {new Date(project.createdAt).toLocaleDateString('fr-FR')}
									</p>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Sélection des statuts -->
				{#if selectedProjectId}
					<div class="bg-white rounded-lg shadow-lg p-6">
						<h2 class="text-lg font-semibold text-gray-800 mb-4">Statuts à importer</h2>
						<p class="text-sm text-gray-600 mb-4">
							Sélectionnez les statuts des contacts que vous souhaitez importer.
						</p>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
							{#each statusOptions as option}
								<label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors {selectedStatuses.includes(option.value) ? 'border-[#6B9AD9] bg-blue-50' : 'border-gray-300 hover:border-gray-400'}">
									<input
										type="checkbox"
										checked={selectedStatuses.includes(option.value)}
										on:change={() => toggleStatus(option.value)}
										class="rounded"
									/>
									<span class="font-medium">{option.label}</span>
								</label>
							{/each}
						</div>

						{#if selectedStatuses.length === 0}
							<p class="text-sm text-red-600 mt-2">
								Veuillez sélectionner au moins un statut.
							</p>
						{/if}
					</div>

					<!-- Information -->
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<div class="flex items-start gap-2">
							<AlertTriangle size={16} class="text-blue-500 mt-0.5 flex-shrink-0" />
							<div class="text-sm">
								<p class="font-medium text-blue-900 mb-1">À propos de l'import</p>
								<ul class="text-blue-800 space-y-1">
									<li>• Les contacts importés auront le statut "Pas encore contacté"</li>
									<li>• Les doublons seront détectés et signalés</li>
									<li>• Seuls les contacts avec les statuts sélectionnés seront importés</li>
									<li>• L'historique original des contacts sera préservé dans le projet source</li>
								</ul>
							</div>
						</div>
					</div>

					<!-- Bouton d'import -->
					<div class="text-center">
						<button
							on:click={importFromProject}
							disabled={importing || selectedStatuses.length === 0}
							class="px-6 py-3 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] disabled:opacity-50 transition-colors flex items-center gap-2 mx-auto"
						>
							{#if importing}
								<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
							{:else}
								<Upload size={20} />
							{/if}
							{importing ? 'Import en cours...' : 'Importer les contacts'}
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Résultats d'import -->
			<div class="space-y-6">
				<div class="bg-white rounded-lg shadow-lg p-6">
					<h2 class="text-xl font-semibold text-gray-800 mb-4">Résultats de l'importation</h2>

					<!-- Succès -->
					{#if importResults.imported.length > 0}
						<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
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
						<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
							<div class="flex items-start gap-2">
								<AlertTriangle class="text-yellow-500 mt-0.5 flex-shrink-0" size={20} />
								<div>
									<h4 class="font-semibold text-yellow-900">
										{importResults.conflicts.length} conflit(s) détecté(s)
									</h4>
									<p class="text-sm text-yellow-800 mt-1">
										Ces contacts existent déjà dans ce projet :
									</p>
									<div class="mt-2 space-y-1">
										{#each importResults.conflicts as conflict}
											<p class="text-sm text-yellow-800">
												⚠️ {conflict.source_contact.first_name} {conflict.source_contact.last_name}
												(déjà présent)
											</p>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Erreurs -->
					{#if importResults.errors.length > 0}
						<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
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

					<div class="flex justify-center gap-4 mt-6">
						<button
							on:click={goBack}
							class="px-6 py-3 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors"
						>
							Retour au recrutement
						</button>
						<button
							on:click={resetImport}
							class="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
						>
							Nouvel import
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>