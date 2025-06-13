<!-- src/routes/projects/[id]/management/auditions/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import DateShow from '$lib/components/DateShow.svelte';
	import { goto } from '$app/navigation';

	export let data;

	let auditions: any[] = [];
	let loading = true;
	let selectedAudition: any = null;
	let showDetailsModal = false;

	onMount(async () => {
		await loadAuditions();
	});

	async function loadAuditions() {
		try {
			const response = await fetch(`/api/projects/${data.id}/management/auditions`);
			if (response.ok) {
				auditions = await response.json();
			} else {
				console.error('Failed to load auditions');
			}
		} catch (error) {
			console.error('Error loading auditions:', error);
		} finally {
			loading = false;
		}
	}

	function getStatusBadge(audition: any) {
		if (audition.is_submitted) {
			return { text: 'Soumise', class: 'bg-green-100 text-green-800' };
		} else if (audition.deadline && new Date(audition.deadline) < new Date()) {
			return { text: 'Expirée', class: 'bg-red-100 text-red-800' };
		} else {
			return { text: 'En cours', class: 'bg-yellow-100 text-yellow-800' };
		}
	}

	function openDetailsModal(audition: any) {
		selectedAudition = audition;
		showDetailsModal = true;
	}

	function closeDetailsModal() {
		selectedAudition = null;
		showDetailsModal = false;
	}

	async function downloadFile(fileId: number, fileName: string) {
		try {
			const response = await fetch(`/api/files/${fileId}`);
			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = fileName;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			} else {
				alert('Erreur lors du téléchargement');
			}
		} catch (error) {
			console.error('Download error:', error);
			alert('Erreur lors du téléchargement');
		}
	}

	function goToValidation(participantId: number) {
		closeDetailsModal();
		goto(`/projects/${data.id}/management/validation`);
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
</script>

<div class="m-4 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Auditions</h1>
		<button
			on:click={() => goto(`/projects/${data.id}/management/validation`)}
			class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			Retour à la validation
		</button>
	</div>

	{#if loading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
			<span class="ml-4 text-gray-600">Chargement des auditions...</span>
		</div>
	{:else if auditions.length === 0}
		<div class="text-center py-12">
			<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
			</svg>
			<h3 class="mt-2 text-sm font-medium text-gray-900">Aucune audition</h3>
			<p class="mt-1 text-sm text-gray-500">Aucune audition n'a été demandée pour ce projet.</p>
		</div>
	{:else}
		<!-- Statistiques -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
			<div class="bg-blue-50 p-4 rounded-lg">
				<div class="text-2xl font-bold text-blue-600">{auditions.length}</div>
				<div class="text-sm text-blue-600">Total auditions</div>
			</div>
			<div class="bg-yellow-50 p-4 rounded-lg">
				<div class="text-2xl font-bold text-yellow-600">
					{auditions.filter(a => !a.is_submitted && (!a.deadline || new Date(a.deadline) >= new Date())).length}
				</div>
				<div class="text-sm text-yellow-600">En cours</div>
			</div>
			<div class="bg-green-50 p-4 rounded-lg">
				<div class="text-2xl font-bold text-green-600">
					{auditions.filter(a => a.is_submitted).length}
				</div>
				<div class="text-sm text-green-600">Soumises</div>
			</div>
			<div class="bg-red-50 p-4 rounded-lg">
				<div class="text-2xl font-bold text-red-600">
					{auditions.filter(a => !a.is_submitted && a.deadline && new Date(a.deadline) < new Date()).length}
				</div>
				<div class="text-sm text-red-600">Expirées</div>
			</div>
		</div>

		<!-- Table des auditions -->
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Candidat
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Section
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Statut
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Date limite
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Fichiers
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Créée le
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Actions
					</th>
				</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
				{#each auditions as audition}
					<tr class="hover:bg-gray-50">
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="flex items-center">
								<div>
									<div class="text-sm font-medium text-gray-900">
										{audition.participant.contact.firstName} {audition.participant.contact.lastName}
									</div>
									<div class="text-sm text-gray-500">
										{audition.participant.contact.email}
									</div>
								</div>
							</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
							{audition.participant.section.name}
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							{@const badge = getStatusBadge(audition)}
							<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {badge.class}">
                                    {badge.text}
                                </span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
							{#if audition.deadline}
								<DateShow startTime={audition.deadline} />
							{:else}
								<span class="text-gray-400">Aucune</span>
							{/if}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                    {audition.files ? audition.files.length : 0} fichier(s)
                                </span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
							<DateShow startTime={audition.createdAt} />
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
							<button
								on:click={() => openDetailsModal(audition)}
								class="text-blue-600 hover:text-blue-900 mr-3"
							>
								Voir détails
							</button>
							<button
								on:click={() => goToValidation(audition.participant.id)}
								class="text-green-600 hover:text-green-900"
							>
								Valider/Refuser
							</button>
						</td>
					</tr>
				{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Modal de détails -->
{#if showDetailsModal && selectedAudition}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
			<div class="px-6 py-4 border-b border-gray-200">
				<div class="flex justify-between items-center">
					<h3 class="text-lg font-medium text-gray-900">
						Audition de {selectedAudition.participant.contact.firstName} {selectedAudition.participant.contact.lastName}
					</h3>
					<button
						on:click={closeDetailsModal}
						class="text-gray-400 hover:text-gray-600"
					>
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			<div class="px-6 py-4">
				<!-- Informations générales -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
					<div>
						<h4 class="text-sm font-medium text-gray-500 mb-1">Candidat</h4>
						<p class="text-sm text-gray-900">{selectedAudition.participant.contact.firstName} {selectedAudition.participant.contact.lastName}</p>
						<p class="text-sm text-gray-500">{selectedAudition.participant.contact.email}</p>
					</div>
					<div>
						<h4 class="text-sm font-medium text-gray-500 mb-1">Section</h4>
						<p class="text-sm text-gray-900">{selectedAudition.participant.section.name}</p>
					</div>
					<div>
						<h4 class="text-sm font-medium text-gray-500 mb-1">Statut</h4>
						{@const badge = getStatusBadge(selectedAudition)}
						<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {badge.class}">
                            {badge.text}
                        </span>
					</div>
					{#if selectedAudition.deadline}
						<div>
							<h4 class="text-sm font-medium text-gray-500 mb-1">Date limite</h4>
							<p class="text-sm text-gray-900">
								<DateShow startTime={selectedAudition.deadline} />
							</p>
						</div>
					{/if}
				</div>

				<!-- Instructions -->
				{#if selectedAudition.instructions}
					<div class="mb-6">
						<h4 class="text-sm font-medium text-gray-500 mb-2">Instructions données</h4>
						<div class="prose max-w-none text-sm text-gray-700 bg-gray-50 p-3 rounded">
							{@html selectedAudition.instructions}
						</div>
					</div>
				{/if}

				<!-- Fichiers requis -->
				{#if selectedAudition.required_files && selectedAudition.required_files.length > 0}
					<div class="mb-6">
						<h4 class="text-sm font-medium text-gray-500 mb-2">Fichiers requis</h4>
						<ul class="text-sm text-gray-700 list-disc list-inside bg-gray-50 p-3 rounded">
							{#each selectedAudition.required_files as file}
								<li>{file}</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Notes du candidat -->
				{#if selectedAudition.candidate_notes}
					<div class="mb-6">
						<h4 class="text-sm font-medium text-gray-500 mb-2">Notes du candidat</h4>
						<div class="text-sm text-gray-700 bg-blue-50 p-3 rounded">
							{selectedAudition.candidate_notes}
						</div>
					</div>
				{/if}

				<!-- Fichiers uploadés -->
				<div class="mb-6">
					<h4 class="text-sm font-medium text-gray-500 mb-2">
						Fichiers uploadés ({selectedAudition.files ? selectedAudition.files.length : 0})
					</h4>
					{#if selectedAudition.files && selectedAudition.files.length > 0}
						<div class="space-y-3">
							{#each selectedAudition.files as auditionFile}
								<div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
									<div class="flex-1">
										<div class="flex items-center space-x-2">
											<!-- Icône selon le type -->
											{#if auditionFile.file_type === 'video'}
												<svg class="h-5 w-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1a1 1 0 001-1v-1h-2zm-2-1h2v-1H13v1zm-2 0h2v-1H11v1zm-2 0h2v-1H9v1zm-2 0h2v-1H7v1zm6-4V5h1a1 1 0 011 1v2h-2z" clip-rule="evenodd" />
												</svg>
											{:else if auditionFile.file_type === 'audio'}
												<svg class="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clip-rule="evenodd" />
												</svg>
											{:else if auditionFile.file_type === 'pdf'}
												<svg class="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
												</svg>
											{:else}
												<svg class="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
												</svg>
											{/if}
											<div>
												<p class="font-medium text-gray-900">{auditionFile.file.name}</p>
												<p class="text-sm text-gray-500">{auditionFile.description}</p>
												<p class="text-xs text-gray-400">
													{auditionFile.file_type} • Uploadé le <DateShow startTime={auditionFile.uploaded_at} />
												</p>
											</div>
										</div>
									</div>
									<button
										on:click={() => downloadFile(auditionFile.file.id, auditionFile.file.name)}
										class="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
									>
										Télécharger
									</button>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-gray-500 italic">Aucun fichier uploadé</p>
					{/if}
				</div>

				<!-- Actions -->
				<div class="flex justify-between">
					<button
						on:click={() => goToValidation(selectedAudition.participant.id)}
						class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
					>
						Aller à la validation
					</button>
					<button
						on:click={closeDetailsModal}
						class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
					>
						Fermer
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
    .prose {
        max-width: none;
    }

    .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
        color: inherit;
        margin-top: 0.5rem;
        margin-bottom: 0.25rem;
    }

    .prose p {
        margin-bottom: 0.5rem;
    }

    .prose ul, .prose ol {
        margin-bottom: 0.5rem;
        padding-left: 1rem;
    }

    .prose li {
        margin-bottom: 0.125rem;
    }
</style>