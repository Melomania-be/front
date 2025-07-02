<!-- src/routes/projects/[id]/management/auditions/+page.svelte - VERSION COMPLÈTE -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import type { Project } from '$lib/types/Project';
	import type { Audition } from '$lib/types/Audition';
	import { onMount } from 'svelte';
	import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte';
	import ProjectPhoneDisplayer from '../ProjectPhoneDisplayer.svelte';

	export let data;

	let project: Project | undefined;
	let auditions: Audition[] = [];
	let loading = true;
	let selectedAudition: Audition | null = null;
	let showAuditionModal = false;

	// Filtres et statistiques
	let filterSection = '';
	let filterStatus = '';
	let searchText = '';

	// Variables pour les statistiques
	let stats = {
		total: 0,
		pending: 0,
		completed: 0,
		overdue: 0
	};

	// Variables pour la gestion des PDFs
	let sections: any[] = [];
	let totalPdfs = 0;

	async function fetchProject() {
		if (!data?.id) return;

		const response = await fetch(`/api/projects/${data.id}`, {
			method: 'GET'
		});

		if (!response.ok) {
			console.error('Failed to fetch project');
			return;
		}
		project = await response.json();
	}

	async function fetchAuditions() {
		if (!data?.id) return;

		try {
			const response = await fetch(`/api/projects/${data.id}/management/auditions`, {
				method: 'GET'
			});

			if (response.ok) {
				auditions = await response.json();
				updateStats();
				console.log('✅ Auditions loaded:', auditions.length);
			} else {
				console.error('❌ Failed to load auditions');
				auditions = [];
			}
		} catch (error) {
			console.error('❌ Error loading auditions:', error);
			auditions = [];
		}
	}

	async function fetchPdfStats() {
		if (!data?.id) return;

		try {
			const response = await fetch(`/api/projects/${data.id}/management/auditions/section-pdfs`);
			if (response.ok) {
				const pdfData = await response.json();
				sections = pdfData.sections || [];
				totalPdfs = pdfData.total_unique_pdfs || 0;
			}
		} catch (error) {
			console.error('Error loading PDF stats:', error);
		}
	}

	function updateStats() {
		if (!auditions) return;

		const now = new Date();
		stats = {
			total: auditions.length,
			pending: auditions.filter(a => !a.is_submitted).length,
			completed: auditions.filter(a => a.is_submitted).length,
			overdue: auditions.filter(a =>
				!a.is_submitted &&
				a.deadline &&
				new Date(a.deadline) < now
			).length
		};
	}

	// Filtrage des auditions
	$: filteredAuditions = auditions.filter(audition => {
		let matchesSection = !filterSection || audition.participant?.section?.name === filterSection;
		let matchesStatus = !filterStatus || getAuditionStatus(audition) === filterStatus;
		let matchesSearch = !searchText ||
			audition.participant?.contact?.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
			audition.participant?.contact?.lastName?.toLowerCase().includes(searchText.toLowerCase()) ||
			audition.participant?.contact?.email?.toLowerCase().includes(searchText.toLowerCase());

		return matchesSection && matchesStatus && matchesSearch;
	});

	// Obtenir toutes les sections uniques
	$: uniqueSections = [...new Set(auditions.map(a => a.participant?.section?.name).filter(Boolean))];

	function getAuditionStatus(audition: Audition): string {
		if (audition.is_submitted) {
			return 'completed';
		}

		if (audition.deadline && new Date(audition.deadline) < new Date()) {
			return 'overdue';
		}

		return 'pending';
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'completed': return 'bg-green-100 text-green-800';
			case 'overdue': return 'bg-red-100 text-red-800';
			case 'pending': return 'bg-yellow-100 text-yellow-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusIcon(status: string): string {
		switch (status) {
			case 'completed': return '✅';
			case 'overdue': return '⚠️';
			case 'pending': return '⏳';
			default: return '❓';
		}
	}

	function formatDate(dateString: any): string {
		if (!dateString) return 'No deadline';
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return 'Invalid date';
			return date.toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return 'Date error';
		}
	}

	function openAuditionDetails(audition: Audition) {
		selectedAudition = audition;
		showAuditionModal = true;
	}

	function closeAuditionModal() {
		showAuditionModal = false;
		selectedAudition = null;
	}

	async function deleteAudition(auditionId: number) {
		if (!confirm('Are you sure you want to delete this audition?')) {
			return;
		}

		try {
			const response = await fetch(`/api/projects/${data.id}/management/auditions/${auditionId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await fetchAuditions();
				closeAuditionModal();
				showNotification('Audition deleted successfully', 'success');
			} else {
				const errorText = await response.text();
				console.error('Delete failed:', errorText);
				showNotification('Error deleting audition', 'error');
			}
		} catch (error) {
			console.error('Error deleting audition:', error);
			showNotification('Network error', 'error');
		}
	}

	function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
		const notification = document.createElement('div');
		const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
		notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm`;
		notification.textContent = message;
		document.body.appendChild(notification);

		setTimeout(() => {
			notification.remove();
		}, 5000);
	}

	function goToPdfManagement() {
		goto(`/projects/${data.id}/management/auditions/pdfs`);
	}

	function goToValidation() {
		goto(`/projects/${data.id}/management/validation`);
	}

	onMount(async () => {
		loading = true;
		await Promise.all([
			fetchProject(),
			fetchAuditions(),
			fetchPdfStats()
		]);
		loading = false;
	});

	let isMobile = false;

	const checkMobile = () => {
		if (browser) {
			isMobile = window.innerWidth <= 1000;
		}
	};

	onMount(() => {
		checkMobile();
		if (browser) {
			window.addEventListener('resize', checkMobile);
		}

		return () => {
			if (browser) {
				window.removeEventListener('resize', checkMobile);
			}
		};
	});
</script>

<svelte:head>
	<title>Auditions Management - Project {data.id}</title>
</svelte:head>

<ProjectHeadDisplayer {project} selectedTab={5} />

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Auditions Management</h1>
				<p class="text-sm text-gray-600 mt-1">
					Manage all auditions for this project
				</p>
			</div>
			<div class="flex gap-3">
				<button
					on:click={goToPdfManagement}
					class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
				>
					📄 Manage PDFs by Section
				</button>
				<button
					on:click={goToValidation}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					👥 Request New Auditions
				</button>
				<button
					on:click={() => goto(`/projects/${data.id}/management`)}
					class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>
					← Back to Project
				</button>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="p-6 {isMobile ? 'pb-20' : ''}">
		{#if loading}
			<div class="flex justify-center items-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
				<span class="ml-4 text-gray-600">Loading auditions...</span>
			</div>
		{:else}
			<!-- Statistics Cards -->
			<div class="grid grid-cols-2 {isMobile ? 'gap-2 mb-4' : 'md:grid-cols-4 gap-4 mb-6'}">
				<div class="bg-blue-50 p-4 rounded-lg">
					<div class="text-2xl font-bold text-blue-600">{stats.total}</div>
					<div class="text-sm text-blue-600">Total Auditions</div>
				</div>
				<div class="bg-yellow-50 p-4 rounded-lg">
					<div class="text-2xl font-bold text-yellow-600">{stats.pending}</div>
					<div class="text-sm text-yellow-600">Pending</div>
				</div>
				<div class="bg-green-50 p-4 rounded-lg">
					<div class="text-2xl font-bold text-green-600">{stats.completed}</div>
					<div class="text-sm text-green-600">Completed</div>
				</div>
				<div class="bg-red-50 p-4 rounded-lg">
					<div class="text-2xl font-bold text-red-600">{stats.overdue}</div>
					<div class="text-sm text-red-600">Overdue</div>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="grid grid-cols-1 {isMobile ? 'gap-3 mb-4' : 'md:grid-cols-3 gap-4 mb-6'}">
				<div class="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="font-medium text-gray-900">PDF Management</h3>
							<p class="text-sm text-gray-600">{totalPdfs} PDFs across {sections.length} sections</p>
						</div>
						<button
							on:click={goToPdfManagement}
							class="px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
						>
							Manage
						</button>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="font-medium text-gray-900">Request Auditions</h3>
							<p class="text-sm text-gray-600">From pending applications</p>
						</div>
						<button
							on:click={goToValidation}
							class="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
						>
							Validate
						</button>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="font-medium text-gray-900">Audition Status</h3>
							<p class="text-sm text-gray-600">{stats.completed}/{stats.total} completed</p>
						</div>
						<div class="text-2xl">
							{#if stats.total === 0}
								😴
							{:else if stats.completed === stats.total}
								🎉
							{:else if stats.overdue > 0}
								⚠️
							{:else}
								⏳
							{/if}
						</div>
					</div>
				</div>
			</div>

			{#if auditions.length === 0}
				<div class="text-center py-12 bg-white rounded-lg shadow">
					<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM9 10l12-3" />
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900">No auditions yet</h3>
					<p class="mt-1 text-sm text-gray-500">Start by requesting auditions from pending applications.</p>
					<div class="mt-6">
						<button
							on:click={goToValidation}
							class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
						>
							Request First Audition
						</button>
					</div>
				</div>
			{:else}
				<!-- Filters -->
				<div class="bg-white rounded-lg shadow p-4 mb-6">
					<div class="grid grid-cols-1 {isMobile ? 'gap-3' : 'md:grid-cols-4 gap-4'}">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
							<input
								type="text"
								bind:value={searchText}
								placeholder="Name or email..."
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Section</label>
							<select
								bind:value={filterSection}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">All sections</option>
								{#each uniqueSections as section}
									<option value={section}>{section}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
							<select
								bind:value={filterStatus}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">All statuses</option>
								<option value="pending">Pending</option>
								<option value="completed">Completed</option>
								<option value="overdue">Overdue</option>
							</select>
						</div>
						<div class="flex items-end">
							<button
								on:click={() => {
									searchText = '';
									filterSection = '';
									filterStatus = '';
								}}
								class="w-full px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
							>
								Clear Filters
							</button>
						</div>
					</div>
				</div>

				<!-- Auditions List -->
				<div class="bg-white rounded-lg shadow overflow-hidden">
					<div class="px-6 py-4 border-b border-gray-200">
						<h2 class="text-lg font-semibold text-gray-900">
							All Auditions ({filteredAuditions.length})
						</h2>
					</div>

					{#if filteredAuditions.length === 0}
						<div class="p-6 text-center text-gray-500">
							No auditions match the current filters.
						</div>
					{:else}
						<div class="divide-y divide-gray-200">
							{#each filteredAuditions as audition}
								{@const status = getAuditionStatus(audition)}
								<div
									class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
									on:click={() => openAuditionDetails(audition)}
								>
									<div class="flex items-center justify-between">
										<div class="flex-1">
											<div class="flex items-center space-x-3">
												<div class="flex-shrink-0">
													<div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
														<span class="text-blue-600 font-medium text-sm">
															{audition.participant?.contact?.firstName?.charAt(0)}{audition.participant?.contact?.lastName?.charAt(0)}
														</span>
													</div>
												</div>
												<div class="min-w-0 flex-1">
													<h3 class="text-sm font-medium text-gray-900 truncate">
														{audition.participant?.contact?.firstName} {audition.participant?.contact?.lastName}
													</h3>
													<p class="text-sm text-gray-500">
														{audition.participant?.contact?.email}
													</p>
													<div class="flex items-center space-x-2 mt-1">
														<span class="text-xs text-blue-600 font-medium">
															{audition.participant?.section?.name}
														</span>
														<span class={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
															{getStatusIcon(status)} {status}
														</span>
													</div>
												</div>
											</div>
										</div>
										<div class="flex items-center space-x-4 text-sm text-gray-500">
											<div class="text-right">
												<div class="text-gray-900 font-medium">
													{formatDate(audition.deadline)}
												</div>
												{#if audition.is_submitted && audition.submitted_at}
													<div class="text-green-600 text-xs">
														Submitted: {formatDate(audition.submitted_at)}
													</div>
												{/if}
												{#if audition.files && audition.files.length > 0}
													<div class="text-blue-600 text-xs">
														{audition.files.length} file{audition.files.length > 1 ? 's' : ''} uploaded
													</div>
												{/if}
											</div>
											<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
											</svg>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Audition Details Modal -->
{#if showAuditionModal && selectedAudition}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
			<div class="px-6 py-4 border-b border-gray-200">
				<div class="flex justify-between items-center">
					<h2 class="text-xl font-bold text-gray-900">
						🎭 Audition Details
					</h2>
					<button
						on:click={closeAuditionModal}
						class="text-gray-400 hover:text-gray-600"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
			</div>

			<div class="px-6 py-4 space-y-6">
				<!-- Candidate Information -->
				<div>
					<h3 class="text-lg font-medium text-gray-900 mb-3">Candidate Information</h3>
					<div class="bg-gray-50 rounded-lg p-4">
						<div class="grid grid-cols-2 gap-4">
							<div>
								<span class="text-sm font-medium text-gray-700">Name:</span>
								<p class="text-gray-900">
									{selectedAudition.participant?.contact?.firstName} {selectedAudition.participant?.contact?.lastName}
								</p>
							</div>
							<div>
								<span class="text-sm font-medium text-gray-700">Email:</span>
								<p class="text-gray-900">{selectedAudition.participant?.contact?.email}</p>
							</div>
							<div>
								<span class="text-sm font-medium text-gray-700">Section:</span>
								<p class="text-gray-900">{selectedAudition.participant?.section?.name}</p>
							</div>
							<div>
								<span class="text-sm font-medium text-gray-700">Status:</span>
								<span class={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(getAuditionStatus(selectedAudition))}`}>
									{getStatusIcon(getAuditionStatus(selectedAudition))} {getAuditionStatus(selectedAudition)}
								</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Audition Details -->
				<div>
					<h3 class="text-lg font-medium text-gray-900 mb-3">Audition Information</h3>
					<div class="bg-gray-50 rounded-lg p-4 space-y-3">
						{#if selectedAudition.deadline}
							<div>
								<span class="text-sm font-medium text-gray-700">Deadline:</span>
								<p class="text-gray-900">{formatDate(selectedAudition.deadline)}</p>
							</div>
						{/if}

						{#if selectedAudition.instructions}
							<div>
								<span class="text-sm font-medium text-gray-700">Instructions:</span>
								<div class="prose max-w-none text-gray-900 mt-1">
									{@html selectedAudition.instructions}
								</div>
							</div>
						{/if}

						{#if selectedAudition.required_files && selectedAudition.required_files.length > 0}
							<div>
								<span class="text-sm font-medium text-gray-700">Required files:</span>
								<ul class="list-disc list-inside text-gray-900 mt-1">
									{#each selectedAudition.required_files as file}
										<li>{file}</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if selectedAudition.is_submitted && selectedAudition.submitted_at}
							<div>
								<span class="text-sm font-medium text-gray-700">Submitted at:</span>
								<p class="text-green-600 font-medium">{formatDate(selectedAudition.submitted_at)}</p>
							</div>
						{/if}

						{#if selectedAudition.candidate_notes}
							<div>
								<span class="text-sm font-medium text-gray-700">Candidate notes:</span>
								<p class="text-gray-900 mt-1">{selectedAudition.candidate_notes}</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- Uploaded Files -->
				{#if selectedAudition.files && selectedAudition.files.length > 0}
					<div>
						<h3 class="text-lg font-medium text-gray-900 mb-3">Uploaded Files</h3>
						<div class="space-y-2">
							{#each selectedAudition.files as file}
								<div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
									<div>
										<h4 class="font-medium text-gray-900">{file.file?.name || 'Unknown file'}</h4>
										<p class="text-sm text-gray-600">{file.description || 'No description'}</p>
										<p class="text-xs text-gray-500">
											Uploaded: {formatDate(file.uploaded_at)}
											• Type: {file.file_type}
										</p>
									</div>
									<!-- You can add download functionality here -->
								</div>
							{/each}
						</div>
					</div>
				{:else if selectedAudition.is_submitted}
					<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
						<p class="text-yellow-800">No files uploaded for this audition.</p>
					</div>
				{/if}
			</div>

			<div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
				<button
					on:click={closeAuditionModal}
					class="px-4 py-2 text-gray-500 hover:text-gray-700"
				>
					Close
				</button>
				<button
					on:click={() => deleteAudition(selectedAudition.id)}
					class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
				>
					Delete Audition
				</button>
			</div>
		</div>
	</div>
{/if}

{#if isMobile}
	<ProjectPhoneDisplayer {project} selectedTab={5} />
{/if}

<style>
    .prose {
        max-width: none;
    }

    .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
        color: inherit;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
    }

    .prose p {
        margin-bottom: 1rem;
    }

    .prose ul, .prose ol {
        margin-bottom: 1rem;
        padding-left: 1.5rem;
    }

    .prose li {
        margin-bottom: 0.25rem;
    }
</style>