<!-- src/routes/projects/[id]/management/auditions/+page.svelte - VERSION AVEC DESIGN UNIFORME ET LECTURE MÉDIA -->
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
		if (!data?.id) {
			console.error('❌ No project ID available');
			return;
		}

		try {
			console.log('🎭 Fetching auditions for project:', data.id);

			const response = await fetch(`/api/projects/${data.id}/management/auditions`, {
				method: 'GET'
			});

			console.log('🎭 Auditions response status:', response.status);

			if (response.ok) {
				const auditionsData = await response.json();
				console.log('🎭 Raw auditions data:', auditionsData);

				// ✅ CORRECTION : Extraire les auditions de l'objet de réponse
				auditions = auditionsData.auditions || [];

				// ✅ BONUS : Extraire les stats si disponibles
				if (auditionsData.stats) {
					stats = {
						total: auditionsData.stats.total || auditions.length,
						pending: auditionsData.stats.pending || auditions.filter(a => !a.is_submitted).length,
						completed: auditionsData.stats.submitted || auditions.filter(a => a.is_submitted).length,
						overdue: auditionsData.stats.expired || auditions.filter(a =>
							!a.is_submitted &&
							a.deadline &&
							new Date(a.deadline) < new Date()
						).length
					};
				} else {
					updateStats(); // Fallback à l'ancien calcul
				}

				console.log('✅ Auditions loaded:', auditions.length);

				// Log détaillé des auditions
				auditions.forEach((audition, index) => {
					console.log(`🎭 Audition ${index + 1}:`, {
						id: audition.id,
						participant: `${audition.participant?.contact?.firstName} ${audition.participant?.contact?.lastName}`,
						section: audition.participant?.section?.name,
						is_submitted: audition.is_submitted,
						deadline: audition.deadline,
						files_count: audition.files?.length || 0
					});
				});

			} else {
				const errorText = await response.text();
				console.error('❌ Failed to load auditions. Status:', response.status);
				console.error('❌ Error response:', errorText);
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

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

	async function downloadFile(fileId: number, fileName: string) {
		try {
			const response = await fetch(`/files/download/${fileId}`);
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
				alert('Error downloading file');
			}
		} catch (error) {
			console.error('Download error:', error);
			alert('Error downloading file');
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

<!-- ✅ NOUVEAU DESIGN : Utilisation du même style que la page des participants -->
<div class="bg-[#E7E7E7] p-4 min-h-screen pb-[80px]">
	<div class="p-4 gap-4 flex flex-col">

		{#if loading}
			<!-- Loading state avec le même style -->
			<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
				<div class="flex justify-center items-center py-12">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
					<span class="ml-4 text-gray-600">Loading auditions...</span>
				</div>
			</div>
		{:else}

			<!-- Statistics Cards -->
			<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
				<h1 class="font-bold text-lg mb-4">AUDITIONS OVERVIEW</h1>
				<div class="grid grid-cols-2 {isMobile ? 'gap-2' : 'md:grid-cols-4 gap-4'}">
					<div class="bg-blue-50 border border-blue-200 p-4 rounded-lg">
						<div class="text-2xl font-bold text-blue-600">{stats.total}</div>
						<div class="text-sm text-blue-600">Total Auditions</div>
					</div>
					<div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
						<div class="text-2xl font-bold text-yellow-600">{stats.pending}</div>
						<div class="text-sm text-yellow-600">Pending</div>
					</div>
					<div class="bg-green-50 border border-green-200 p-4 rounded-lg">
						<div class="text-2xl font-bold text-green-600">{stats.completed}</div>
						<div class="text-sm text-green-600">Completed</div>
					</div>
					<div class="bg-red-50 border border-red-200 p-4 rounded-lg">
						<div class="text-2xl font-bold text-red-600">{stats.overdue}</div>
						<div class="text-sm text-red-600">Overdue</div>
					</div>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
				<h1 class="font-bold text-lg mb-4">QUICK ACTIONS</h1>
				<div class="grid grid-cols-1 {isMobile ? 'gap-3' : 'md:grid-cols-3 gap-4'}">
					<div class="bg-purple-50 border border-purple-200 rounded-lg p-4 border-l-4 border-l-purple-500">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="font-medium text-gray-900">PDF Management</h3>
								<p class="text-sm text-gray-600">{totalPdfs} PDFs across {sections.length} sections</p>
							</div>
							<button
								on:click={goToPdfManagement}
								class="px-3 py-2 bg-[#6B9AD9] text-white text-sm rounded hover:bg-blue-600 font-semibold"
							>
								Manage
							</button>
						</div>
					</div>

					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 border-l-4 border-l-blue-500">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="font-medium text-gray-900">Request Auditions</h3>
								<p class="text-sm text-gray-600">From pending applications</p>
							</div>
							<button
								on:click={goToValidation}
								class="px-3 py-2 bg-[#6B9AD9] text-white text-sm rounded hover:bg-blue-600 font-semibold"
							>
								Validate
							</button>
						</div>
					</div>

					<div class="bg-green-50 border border-green-200 rounded-lg p-4 border-l-4 border-l-green-500">
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
			</div>

			{#if auditions.length === 0}
				<!-- Empty state -->
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
					<div class="text-center py-12">
						<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM9 10l12-3" />
						</svg>
						<h3 class="mt-2 text-sm font-medium text-gray-900">No auditions yet</h3>
						<p class="mt-1 text-sm text-gray-500">Start by requesting auditions from pending applications.</p>
						<div class="mt-6">
							<button
								on:click={goToValidation}
								class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-blue-600 font-semibold"
							>
								Request First Audition
							</button>
						</div>
					</div>
				</div>
			{:else}
				<!-- Filters -->
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
					<h1 class="font-bold text-lg mb-4">FILTERS</h1>
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
								class="w-full px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-semibold"
							>
								Clear Filters
							</button>
						</div>
					</div>
				</div>

				<!-- Auditions List -->
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
					<div class="flex items-center justify-between mb-4">
						<h1 class="font-bold text-lg">
							ALL AUDITIONS ({filteredAuditions.length})
						</h1>
					</div>

					{#if filteredAuditions.length === 0}
						<div class="p-6 text-center text-gray-500">
							No auditions match the current filters.
						</div>
					{:else}
						<div class="w-full overflow-x-auto">
							<table class="w-full min-w-[800px] text-sm text-left rtl:text-right text-gray-500">
								<thead class="bg-gray-100 text-xs text-gray-700 uppercase">
								<tr>
									<th class="px-4 py-2">Participant</th>
									<th class="px-4 py-2">Email</th>
									<th class="px-4 py-2">Section</th>
									<th class="px-4 py-2">Status</th>
									<th class="px-4 py-2">Deadline</th>
									<th class="px-4 py-2">Files</th>
									<th class="px-4 py-2">Actions</th>
								</tr>
								</thead>
								<tbody>
								{#each filteredAuditions as audition}
									{@const status = getAuditionStatus(audition)}
									<tr class="cursor-pointer hover:bg-gray-100 border-b border-gray-200">
										<td class="px-4 py-2">
											<div class="flex items-center space-x-3">
												<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
														<span class="text-blue-600 font-medium text-xs">
															{audition.participant?.contact?.firstName?.charAt(0)}{audition.participant?.contact?.lastName?.charAt(0)}
														</span>
												</div>
												<span class="font-medium text-gray-900">
														{audition.participant?.contact?.firstName} {audition.participant?.contact?.lastName}
													</span>
											</div>
										</td>
										<td class="px-4 py-2">{audition.participant?.contact?.email}</td>
										<td class="px-4 py-2">
												<span class="text-blue-600 font-medium">
													{audition.participant?.section?.name}
												</span>
										</td>
										<td class="px-4 py-2">
												<span class={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
													{getStatusIcon(status)} {status}
												</span>
										</td>
										<td class="px-4 py-2">
											<div class="text-gray-900 font-medium">
												{formatDate(audition.deadline)}
											</div>
											{#if audition.is_submitted && audition.submitted_at}
												<div class="text-green-600 text-xs">
													Submitted: {formatDate(audition.submitted_at)}
												</div>
											{/if}
										</td>
										<td class="px-4 py-2">
											{#if audition.files && audition.files.length > 0}
												<div class="text-blue-600 text-xs">
													{audition.files.length} file{audition.files.length > 1 ? 's' : ''}
												</div>
											{:else}
												<span class="text-gray-400 text-xs">No files</span>
											{/if}
										</td>
										<td class="px-4 py-2">
											<button
												on:click={() => openAuditionDetails(audition)}
												class="px-3 py-1 bg-[#6B9AD9] text-white text-xs rounded hover:bg-blue-600 font-semibold"
											>
												View Details
											</button>
										</td>
									</tr>
								{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</div>

	{#if isMobile}
		<ProjectPhoneDisplayer {project} selectedTab={5} />
	{/if}
</div>

<!-- Audition Details Modal with Unified Design -->
{#if showAuditionModal && selectedAudition}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-[#E7E7E7] rounded-[10px] shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
			<!-- Header -->
			<div class="bg-white border-2 border-[#8C8C8C] rounded-t-[10px] p-4">
				<div class="flex justify-between items-center">
					<h1 class="font-bold text-lg">
						🎭 AUDITION DETAILS
					</h1>
					<button
						on:click={closeAuditionModal}
						class="text-gray-400 hover:text-gray-600 p-2"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
			</div>

			<div class="p-4 space-y-4">
				<!-- Candidate Information -->
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
					<h1 class="font-bold text-lg mb-4">CANDIDATE INFORMATION</h1>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<span class="text-sm font-medium text-gray-700">Name:</span>
							<p class="text-gray-900 font-semibold">
								{selectedAudition.participant?.contact?.firstName} {selectedAudition.participant?.contact?.lastName}
							</p>
						</div>
						<div>
							<span class="text-sm font-medium text-gray-700">Email:</span>
							<p class="text-gray-900">{selectedAudition.participant?.contact?.email}</p>
						</div>
						<div>
							<span class="text-sm font-medium text-gray-700">Section:</span>
							<p class="text-blue-600 font-semibold">{selectedAudition.participant?.section?.name}</p>
						</div>
						<div>
							<span class="text-sm font-medium text-gray-700">Status:</span>
							<span class={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(getAuditionStatus(selectedAudition))}`}>
								{getStatusIcon(getAuditionStatus(selectedAudition))} {getAuditionStatus(selectedAudition)}
							</span>
						</div>
					</div>
				</div>

				<!-- Audition Details -->
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
					<h1 class="font-bold text-lg mb-4">AUDITION INFORMATION</h1>
					<div class="space-y-3">
						{#if selectedAudition.deadline}
							<div>
								<span class="text-sm font-medium text-gray-700">Deadline:</span>
								<p class="text-gray-900 font-semibold">{formatDate(selectedAudition.deadline)}</p>
							</div>
						{/if}

						{#if selectedAudition.instructions}
							<div>
								<span class="text-sm font-medium text-gray-700">Instructions:</span>
								<div class="prose max-w-none text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
									{@html selectedAudition.instructions}
								</div>
							</div>
						{/if}

						{#if selectedAudition.required_files && selectedAudition.required_files.length > 0}
							<div>
								<span class="text-sm font-medium text-gray-700">Required files:</span>
								<ul class="list-disc list-inside text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
									{#each selectedAudition.required_files as file}
										<li>{file}</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if selectedAudition.is_submitted && selectedAudition.submitted_at}
							<div>
								<span class="text-sm font-medium text-gray-700">Submitted at:</span>
								<p class="text-green-600 font-semibold">{formatDate(selectedAudition.submitted_at)}</p>
							</div>
						{/if}

						{#if selectedAudition.candidate_notes}
							<div>
								<span class="text-sm font-medium text-gray-700">Candidate notes:</span>
								<div class="text-gray-900 mt-1 bg-blue-50 p-3 rounded-lg border border-blue-200">
									{selectedAudition.candidate_notes}
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- PDFs provided -->
				{#if selectedAudition.pdfs && selectedAudition.pdfs.length > 0}
					<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
						<h1 class="font-bold text-lg mb-4">📚 PDFS PROVIDED ({selectedAudition.pdfs.length})</h1>
						<div class="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
							<div class="grid grid-cols-1 {isMobile ? '' : 'md:grid-cols-2'} gap-3">
								{#each selectedAudition.pdfs as pdf}
									<div class="flex items-center justify-between p-3 bg-white border border-purple-200 rounded-lg">
										<div>
											<p class="font-semibold text-purple-900">{pdf.title}</p>
											{#if pdf.description}
												<p class="text-xs text-purple-700">{pdf.description}</p>
											{/if}
											<p class="text-xs text-gray-500">{pdf.file.name}</p>
										</div>
										<span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-semibold">PDF</span>
									</div>
								{/each}
							</div>
							<p class="text-xs text-purple-700 mt-2 font-medium">
								✅ The candidate can download these PDFs and should play them in their audition recordings.
							</p>
						</div>
					</div>
				{/if}

				<!-- Enhanced Uploaded Files with Media Players -->
				{#if selectedAudition.files && selectedAudition.files.length > 0}
					<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
						<h1 class="font-bold text-lg mb-4">
							🎵 UPLOADED PERFORMANCE FILES ({selectedAudition.files.length})
							{#if selectedAudition.is_submitted}
								<span class="ml-2 text-green-600 font-bold">✅ COMPLETE</span>
							{/if}
						</h1>
						<div class="space-y-4">
							{#each selectedAudition.files as auditionFile}
								<div class="border-2 border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
									<!-- File Header -->
									<div class="p-3 bg-white border-b-2 border-gray-300">
										<div class="flex items-center justify-between {isMobile ? 'flex-col items-start space-y-2' : ''}">
											<div class="flex-1 {isMobile ? 'w-full' : ''}">
												<div class="flex items-center space-x-2">
													<!-- File Type Icon -->
													{#if auditionFile.file_type === 'video'}
														<svg class="h-5 w-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
															<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5z" clip-rule="evenodd" />
														</svg>
													{:else if auditionFile.file_type === 'audio'}
														<svg class="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
															<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clip-rule="evenodd" />
														</svg>
													{:else}
														<svg class="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
															<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
														</svg>
													{/if}
													<div>
														<p class="font-semibold text-gray-900">{auditionFile.file?.name}</p>
														<p class="text-xs text-gray-500">{auditionFile.description || 'No description'}</p>
														<p class="text-xs text-gray-400">
															{auditionFile.file_type} • Uploaded: {formatDate(auditionFile.uploaded_at)}
															{#if auditionFile.file?.size}
																• {formatFileSize(auditionFile.file.size)}
															{/if}
														</p>
													</div>
												</div>
											</div>
											<button
												on:click={() => downloadFile(auditionFile.file.id, auditionFile.file.name)}
												class="{isMobile ? 'w-full' : ''} px-3 py-2 text-sm bg-[#6B9AD9] text-white rounded hover:bg-blue-600 font-semibold flex items-center space-x-1"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
												</svg>
												<span>Download</span>
											</button>
										</div>
									</div>

									<!-- Integrated Media Player -->
									<div class="p-3">
										{#if auditionFile.file_type === 'video'}
											<!-- Video Player -->
											<div class="bg-black rounded-lg overflow-hidden border-2 border-gray-400">
												<video
													controls
													preload="metadata"
													class="w-full max-h-96"
													poster=""
													on:error={(e) => console.error('Video error:', e)}
												>
													<source src="/files/download/{auditionFile.file.id}" type="video/mp4">
													<source src="/files/download/{auditionFile.file.id}" type="video/webm">
													<p class="text-white p-4">
														Your browser does not support video playback.
														<button
															on:click={() => downloadFile(auditionFile.file.id, auditionFile.file.name)}
															class="text-blue-300 underline ml-2"
														>
															Download file
														</button>
													</p>
												</video>
											</div>
										{:else if auditionFile.file_type === 'audio'}
											<!-- Audio Player -->
											<div class="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
												<audio
													controls
													preload="metadata"
													class="w-full"
													on:error={(e) => console.error('Audio error:', e)}
												>
													<source src="/files/download/{auditionFile.file.id}" type="audio/mpeg">
													<source src="/files/download/{auditionFile.file.id}" type="audio/wav">
													<source src="/files/download/{auditionFile.file.id}" type="audio/ogg">
													<p class="text-gray-600">
														Your browser does not support audio playback.
														<button
															on:click={() => downloadFile(auditionFile.file.id, auditionFile.file.name)}
															class="text-blue-600 underline ml-2"
														>
															Download file
														</button>
													</p>
												</audio>
											</div>
										{:else}
											<!-- Non-media file -->
											<div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
												<div class="flex items-center">
													<svg class="h-5 w-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
														<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
													</svg>
													<p class="text-yellow-700 font-medium">
														This file cannot be played directly in the browser.
													</p>
												</div>
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{:else if selectedAudition.is_submitted}
					<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
						<h1 class="font-bold text-lg mb-4">🎵 UPLOADED PERFORMANCE FILES</h1>
						<div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
							<p class="text-yellow-800 font-medium">No files uploaded for this audition.</p>
						</div>
					</div>
				{/if}

				<!-- Actions -->
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
					<div class="flex {isMobile ? 'flex-col space-y-3' : 'justify-end space-x-3'}">
						<button
							on:click={closeAuditionModal}
							class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-semibold {isMobile ? 'w-full' : ''}"
						>
							Close
						</button>
						<button
							on:click={() => deleteAudition(selectedAudition.id)}
							class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold {isMobile ? 'w-full' : ''}"
						>
							Delete Audition
						</button>
					</div>
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

    /* Video player styles */
    video {
        background-color: #000;
        border-radius: 8px;
    }

    video::-webkit-media-controls-panel {
        background-color: rgba(0, 0, 0, 0.8);
    }

    /* Custom audio player styles */
    audio {
        height: 54px;
        background-color: #f8f9fa;
        border-radius: 8px;
    }

    audio::-webkit-media-controls-panel {
        background-color: #f8f9fa;
    }

    /* Mobile improvements */
    @media (max-width: 768px) {
        video {
            max-height: 250px;
        }

        audio {
            height: 48px;
        }
    }

    /* Loading animation for media */
    video, audio {
        transition: opacity 0.3s ease;
    }

    video:not([src]), audio:not([src]) {
        opacity: 0.6;
    }

    /* Custom loading indicator */
    .media-loading {
        position: relative;
    }

    .media-loading::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border: 3px solid #f3f4f6;
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        z-index: 10;
    }

    @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
</style>