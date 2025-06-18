<!-- src/routes/projects/[id]/management/auditions/+page.svelte - AVEC SUPPRESSION -->
<script lang="ts">
	import { onMount } from 'svelte';
	import DateShow from '$lib/components/DateShow.svelte';
	import { goto } from '$app/navigation';

	export let data;

	let auditions: any[] = [];
	let loading = true;
	let selectedAudition: any = null;
	let showDetailsModal = false;
	let autoRefresh = true;
	let refreshInterval: any = null;
	let isMobile = false;
	let showMobileMenu = false;

	// ✅ NOUVELLES VARIABLES pour la suppression
	let showDeleteModal = false;
	let auditionToDelete: any = null;
	let isDeleting = false;

	// Statistics from server
	let auditionStats: any = {
		total: 0,
		submitted: 0,
		pending: 0,
		expired: 0,
		totalFiles: 0
	};

	// ✅ DATE FORMATTING UTILITIES (English)
	function formatDate(dateString) {
		if (!dateString) return 'Unknown date';

		try {
			const date = new Date(dateString);

			if (isNaN(date.getTime())) {
				console.error('Invalid date:', dateString);
				return 'Invalid date';
			}

			return date.toLocaleDateString('en-GB', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (error) {
			console.error('Error formatting date:', error, dateString);
			return 'Date error';
		}
	}

	function formatDateShort(dateString) {
		if (!dateString) return 'N/A';

		try {
			const date = new Date(dateString);

			if (isNaN(date.getTime())) {
				return 'Invalid';
			}

			return date.toLocaleDateString('en-GB');
		} catch (error) {
			console.error('Error formatting short date:', error, dateString);
			return 'Error';
		}
	}

	// ✅ MOBILE DETECTION
	onMount(async () => {
		// Check if mobile
		isMobile = window.innerWidth < 768;

		// Listen for resize
		const handleResize = () => {
			isMobile = window.innerWidth < 768;
		};
		window.addEventListener('resize', handleResize);

		await loadAuditions();

		// Auto-refresh every 30 seconds
		if (autoRefresh) {
			refreshInterval = setInterval(async () => {
				await loadAuditions(true); // silent refresh
			}, 30000);
		}

		// Cleanup
		return () => {
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
			window.removeEventListener('resize', handleResize);
		};
	});

	async function loadAuditions(silent = false) {
		if (!silent) {
			loading = true;
		}

		try {
			const response = await fetch(`/api/projects/${data.id}/management/auditions`);
			if (response.ok) {
				const responseData = await response.json();

				// Compare with previous data to detect changes
				if (auditions.length > 0 && !silent) {
					const newSubmissions = responseData.auditions.filter(newAud =>
						newAud.is_submitted &&
						!auditions.find(oldAud => oldAud.id === newAud.id && oldAud.is_submitted)
					);

					if (newSubmissions.length > 0) {
						showNotification(`${newSubmissions.length} new audition${newSubmissions.length > 1 ? 's' : ''} submitted!`);
					}
				}

				auditions = responseData.auditions || [];
				auditionStats = responseData.stats || {
					total: 0,
					submitted: 0,
					pending: 0,
					expired: 0,
					totalFiles: 0
				};
			} else {
				console.error('Failed to load auditions');
			}
		} catch (error) {
			console.error('Error loading auditions:', error);
		} finally {
			if (!silent) {
				loading = false;
			}
		}
	}

	function showNotification(message: string) {
		const notification = document.createElement('div');
		notification.className = `fixed ${isMobile ? 'top-2 left-2 right-2' : 'top-4 right-4'} bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 text-sm`;
		notification.textContent = message;
		document.body.appendChild(notification);

		setTimeout(() => {
			notification.remove();
		}, 5000);
	}

	function getStatusBadge(audition: any) {
		if (audition.is_submitted) {
			return { text: 'Submitted', class: 'bg-green-100 text-green-800', icon: '✅' };
		} else if (audition.deadline && new Date(audition.deadline) < new Date()) {
			return { text: 'Expired', class: 'bg-red-100 text-red-800', icon: '⏰' };
		} else {
			return { text: 'In Progress', class: 'bg-yellow-100 text-yellow-800', icon: '⏳' };
		}
	}

	function openDetailsModal(audition: any) {
		selectedAudition = audition;
		showDetailsModal = true;
		// Prevent body scroll on mobile
		if (isMobile) {
			document.body.style.overflow = 'hidden';
		}
	}

	function closeDetailsModal() {
		selectedAudition = null;
		showDetailsModal = false;
		// Restore body scroll
		document.body.style.overflow = '';
	}

	// ✅ NOUVELLES FONCTIONS pour la suppression
	function openDeleteModal(audition: any) {
		auditionToDelete = audition;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		auditionToDelete = null;
		showDeleteModal = false;
		isDeleting = false;
	}

	async function confirmDeleteAudition() {
		if (!auditionToDelete) return;

		isDeleting = true;

		try {
			// ✅ APPEL API DIRECT avec paramètres URL
			const response = await fetch(`/api/projects/${data.id}/management/auditions?auditionId=${auditionToDelete.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				const result = await response.json();
				console.log('Audition deleted:', result);

				// Recharger la liste des auditions
				await loadAuditions();

				// Fermer le modal
				closeDeleteModal();

				// Fermer le modal de détails si c'était la même audition
				if (selectedAudition && selectedAudition.id === auditionToDelete.id) {
					closeDetailsModal();
				}

				showNotification(`Audition deleted successfully (${result.deleted_files_count} file(s) removed)`);
			} else {
				const errorData = await response.json().catch(() => null);
				alert(`Error deleting audition: ${errorData?.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error deleting audition:', error);
			alert('Network error during deletion');
		} finally {
			isDeleting = false;
		}
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
				alert('Error downloading file');
			}
		} catch (error) {
			console.error('Download error:', error);
			alert('Error downloading file');
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

	function toggleAutoRefresh() {
		autoRefresh = !autoRefresh;

		if (autoRefresh) {
			refreshInterval = setInterval(async () => {
				await loadAuditions(true);
			}, 30000);
		} else {
			if (refreshInterval) {
				clearInterval(refreshInterval);
				refreshInterval = null;
			}
		}
	}

	function toggleMobileMenu() {
		showMobileMenu = !showMobileMenu;
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Mobile Header -->
	{#if isMobile}
		<div class="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-lg font-bold text-gray-900">Auditions</h1>
					<p class="text-xs text-gray-500">
						Last updated: {new Date().toLocaleTimeString('en-GB')}
					</p>
				</div>
				<button
					on:click={toggleMobileMenu}
					class="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
					</svg>
				</button>
			</div>

			<!-- Mobile Menu -->
			{#if showMobileMenu}
				<div class="absolute top-full left-0 right-0 bg-white border-b border-gray-200 p-4 space-y-2">
					<button
						on:click={() => { loadAuditions(); toggleMobileMenu(); }}
						class="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
						disabled={loading}
					>
						{#if loading}
							<div class="flex items-center">
								<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
								Refreshing...
							</div>
						{:else}
							🔄 Refresh
						{/if}
					</button>

					<button
						on:click={() => { toggleAutoRefresh(); toggleMobileMenu(); }}
						class="w-full px-3 py-2 {autoRefresh ? 'bg-green-600' : 'bg-gray-600'} text-white rounded-lg text-sm"
					>
						{autoRefresh ? '⏸️ Stop Auto-refresh' : '▶️ Start Auto-refresh'}
					</button>

					<button
						on:click={() => { goto(`/projects/${data.id}/management/validation`); }}
						class="w-full px-3 py-2 bg-purple-600 text-white rounded-lg text-sm"
					>
						Back to Validation
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Desktop Header -->
		<div class="bg-white border-b border-gray-200 px-6 py-4">
			<div class="flex justify-between items-center">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Auditions Management</h1>
					<p class="text-sm text-gray-600 mt-1">
						Last updated: {new Date().toLocaleTimeString('en-GB')}
					</p>
				</div>
				<div class="flex gap-3">
					<button
						on:click={() => loadAuditions()}
						class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={loading}
					>
						{#if loading}
							<div class="flex items-center">
								<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
								Refreshing...
							</div>
						{:else}
							🔄 Refresh
						{/if}
					</button>

					<button
						on:click={toggleAutoRefresh}
						class="px-4 py-2 {autoRefresh ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'} text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						{autoRefresh ? '⏸️ Stop Auto-refresh' : '▶️ Start Auto-refresh'}
					</button>

					<button
						on:click={() => goto(`/projects/${data.id}/management/validation`)}
						class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
					>
						Back to Validation
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main Content -->
	<div class="p-4 {isMobile ? 'pb-20' : 'p-6'}">
		{#if loading}
			<div class="flex justify-center items-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
				<span class="ml-4 text-gray-600">Loading auditions...</span>
			</div>
		{:else if auditions.length === 0}
			<div class="text-center py-12">
				<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				<h3 class="mt-2 text-sm font-medium text-gray-900">No auditions</h3>
				<p class="mt-1 text-sm text-gray-500">No auditions have been requested for this project.</p>
			</div>
		{:else}
			<!-- Statistics Cards -->
			<div class="grid grid-cols-2 {isMobile ? 'gap-2 mb-4' : 'md:grid-cols-5 gap-4 mb-6'}">
				<div class="bg-blue-50 p-3 rounded-lg">
					<div class="text-xl {isMobile ? '' : '2xl'} font-bold text-blue-600">{auditionStats.total}</div>
					<div class="text-xs {isMobile ? '' : 'sm'} text-blue-600">Total</div>
				</div>
				<div class="bg-yellow-50 p-3 rounded-lg">
					<div class="text-xl {isMobile ? '' : '2xl'} font-bold text-yellow-600">{auditionStats.pending}</div>
					<div class="text-xs {isMobile ? '' : 'sm'} text-yellow-600">In Progress</div>
				</div>
				<div class="bg-green-50 p-3 rounded-lg border-2 {auditionStats.submitted > 0 ? 'border-green-300' : 'border-transparent'}">
					<div class="text-xl {isMobile ? '' : '2xl'} font-bold text-green-600 flex items-center">
						{auditionStats.submitted}
						{#if auditionStats.submitted > 0}
							<span class="ml-1 text-sm">🎯</span>
						{/if}
					</div>
					<div class="text-xs {isMobile ? '' : 'sm'} text-green-600">Submitted</div>
				</div>
				<div class="bg-red-50 p-3 rounded-lg">
					<div class="text-xl {isMobile ? '' : '2xl'} font-bold text-red-600">{auditionStats.expired}</div>
					<div class="text-xs {isMobile ? '' : 'sm'} text-red-600">Expired</div>
				</div>
				<div class="bg-purple-50 p-3 rounded-lg {isMobile ? 'col-span-2' : ''}">
					<div class="text-xl {isMobile ? '' : '2xl'} font-bold text-purple-600">{auditionStats.totalFiles}</div>
					<div class="text-xs {isMobile ? '' : 'sm'} text-purple-600">Files Received</div>
				</div>
			</div>

			<!-- Success Alert -->
			{#if auditionStats.submitted > 0}
				<div class="mb-4 p-3 {isMobile ? '' : 'p-4'} bg-green-100 border border-green-300 rounded-lg">
					<div class="flex items-center">
						<span class="text-green-600 text-lg {isMobile ? '' : 'xl'} mr-2 {isMobile ? '' : '3'}">🎉</span>
						<div>
							<h4 class="text-green-800 font-medium text-sm {isMobile ? '' : 'base'}">
								{auditionStats.submitted} audition{auditionStats.submitted > 1 ? 's have been submitted' : ' has been submitted'}!
							</h4>
							<p class="text-green-700 text-xs {isMobile ? '' : 'sm'}">
								You can now evaluate them and make decisions.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Mobile Auditions List -->
			{#if isMobile}
				<div class="space-y-3">
					{#each auditions as audition (audition.id)}
						<div class="bg-white border border-gray-200 rounded-lg p-4 {audition.is_submitted ? 'bg-green-25 border-green-200' : ''}">
							<!-- Header -->
							<div class="flex justify-between items-start mb-2">
								<div class="flex-1">
									<h3 class="font-medium text-gray-900 text-sm">
										{audition.participant.contact.firstName} {audition.participant.contact.lastName}
									</h3>
									<p class="text-xs text-gray-500">{audition.participant.contact.email}</p>
									<p class="text-xs text-blue-600">{audition.participant.section.name}</p>
								</div>
								{#if true}
									{@const badge = getStatusBadge(audition)}
									<span class="px-2 py-1 text-xs font-semibold rounded-full {badge.class}">
										{badge.icon} {badge.text}
									</span>
								{/if}
							</div>

							<!-- Details -->
							<div class="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
								<div>
									<span class="font-medium">Files:</span>
									{audition.files ? audition.files.length : 0}
								</div>
								<div>
									<span class="font-medium">Created:</span>
									{formatDateShort(audition.createdAt)}
								</div>
								{#if audition.deadline}
									<div class="col-span-2">
										<span class="font-medium">Deadline:</span>
										{formatDateShort(audition.deadline)}
										{#if !audition.is_submitted && new Date(audition.deadline) < new Date()}
											<span class="text-red-500 font-medium ml-1">Expired</span>
										{/if}
									</div>
								{/if}
								{#if audition.is_submitted}
									<div class="col-span-2 text-green-600 font-medium">
										✅ Submitted on {formatDate(audition.submitted_at)}
									</div>
								{/if}
							</div>

							<!-- Actions -->
							<div class="flex gap-2">
								<button
									on:click={() => openDetailsModal(audition)}
									class="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
								>
									👁️ Details
								</button>
								<button
									on:click={() => goToValidation(audition.participant.id)}
									class="flex-1 px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700"
								>
									{audition.is_submitted ? '✅ Decide' : '⏳ Validate'}
								</button>
								<!-- ✅ NOUVEAU : Bouton suppression mobile -->
								<button
									on:click={() => openDeleteModal(audition)}
									class="px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700"
									title="Delete audition"
								>
									🗑️
								</button>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<!-- Desktop Table -->
				<div class="bg-white rounded-lg shadow overflow-hidden">
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Candidate
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Section
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Deadline
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Files
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Created
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
							{#each auditions as audition (audition.id)}
								<tr class="hover:bg-gray-50 {audition.is_submitted ? 'bg-green-25' : ''}">
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center">
											<div>
												<div class="text-sm font-medium text-gray-900">
													{audition.participant.contact.firstName} {audition.participant.contact.lastName}
												</div>
												<div class="text-sm text-gray-500">
													{audition.participant.contact.email}
												</div>
												{#if audition.is_submitted}
													<div class="text-xs text-green-600 font-medium mt-1">
														✅ Submitted on {formatDate(audition.submitted_at)}
													</div>
												{/if}
											</div>
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{audition.participant.section.name}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										{#if true}
											{@const badge = getStatusBadge(audition)}
											<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {badge.class}">
												{badge.icon} {badge.text}
											</span>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{#if audition.deadline}
											{formatDateShort(audition.deadline)}
											{#if !audition.is_submitted && new Date(audition.deadline) < new Date()}
												<div class="text-xs text-red-500 font-medium">Expired</div>
											{/if}
										{:else}
											<span class="text-gray-400">None</span>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										<div class="flex items-center">
											<span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
												{audition.files ? audition.files.length : 0} file{audition.files && audition.files.length > 1 ? 's' : ''}
											</span>
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{formatDateShort(audition.createdAt)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
										<div class="flex space-x-2">
											<button
												on:click={() => openDetailsModal(audition)}
												class="text-blue-600 hover:text-blue-900 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
											>
												👁️ Details
											</button>
											<button
												on:click={() => goToValidation(audition.participant.id)}
												class="text-green-600 hover:text-green-900 px-2 py-1 rounded border border-green-200 hover:bg-green-50"
											>
												{audition.is_submitted ? '✅ Decide' : '⏳ Validate'}
											</button>
											<!-- ✅ NOUVEAU : Bouton suppression desktop -->
											<button
												on:click={() => openDeleteModal(audition)}
												class="text-red-600 hover:text-red-900 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
												title="Delete audition"
											>
												🗑️ Delete
											</button>
										</div>
									</td>
								</tr>
							{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			<!-- Summary -->
			<div class="mt-6 p-4 bg-white rounded-lg border border-gray-200">
				<div class="grid grid-cols-1 {isMobile ? '' : 'md:grid-cols-2'} gap-4">
					<div>
						<h4 class="font-medium text-gray-900 mb-2">Auditions Summary</h4>
						<ul class="text-sm text-gray-600 space-y-1">
							<li>• {auditionStats.total} audition{auditionStats.total > 1 ? 's' : ''} requested</li>
							<li>• {auditionStats.submitted} submitted and ready to evaluate</li>
							<li>• {auditionStats.pending} still in progress</li>
							<li>• {auditionStats.totalFiles} file{auditionStats.totalFiles > 1 ? 's' : ''} received in total</li>
						</ul>
					</div>
					<div>
						<h4 class="font-medium text-gray-900 mb-2">Recommended Actions</h4>
						<ul class="text-sm text-gray-600 space-y-1">
							{#if auditionStats.submitted > 0}
								<li class="text-green-600">✅ Evaluate the {auditionStats.submitted} submitted audition{auditionStats.submitted > 1 ? 's' : ''}</li>
							{/if}
							{#if auditionStats.expired > 0}
								<li class="text-red-600">⚠️ {auditionStats.expired} expired audition{auditionStats.expired > 1 ? 's' : ''} to handle</li>
							{/if}
							{#if auditionStats.pending > 0}
								<li class="text-yellow-600">⏳ {auditionStats.pending} audition{auditionStats.pending > 1 ? 's' : ''} pending</li>
							{/if}
						</ul>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Enhanced Details Modal -->
{#if showDetailsModal && selectedAudition}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 {isMobile ? 'p-2' : 'p-4'}">
		<div class="bg-white rounded-lg shadow-lg {isMobile ? 'w-full h-full overflow-y-auto' : 'max-w-4xl w-full max-h-[90vh] overflow-y-auto'}">
			<div class="px-4 {isMobile ? '' : '6'} py-4 border-b border-gray-200 {isMobile ? 'sticky top-0 bg-white' : ''}">
				<div class="flex justify-between items-center">
					<h3 class="text-lg font-medium text-gray-900">
						{selectedAudition.participant.contact.firstName} {selectedAudition.participant.contact.lastName}
						{#if selectedAudition.is_submitted}
							<span class="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">✅ Submitted</span>
						{/if}
					</h3>
					<div class="flex items-center space-x-2">
						<!-- ✅ NOUVEAU : Bouton suppression dans le modal -->
						<button
							on:click={() => openDeleteModal(selectedAudition)}
							class="text-red-600 hover:text-red-800 p-1"
							title="Delete audition"
						>
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16" />
							</svg>
						</button>
						<button
							on:click={closeDetailsModal}
							class="text-gray-400 hover:text-gray-600 p-1"
						>
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			</div>

			<div class="px-4 {isMobile ? '' : '6'} py-4">
				<!-- General Information -->
				<div class="grid grid-cols-1 {isMobile ? '' : 'md:grid-cols-2'} gap-4 mb-6">
					<div>
						<h4 class="text-sm font-medium text-gray-500 mb-1">Candidate</h4>
						<p class="text-sm text-gray-900">{selectedAudition.participant.contact.firstName} {selectedAudition.participant.contact.lastName}</p>
						<p class="text-sm text-gray-500">{selectedAudition.participant.contact.email}</p>
					</div>
					<div>
						<h4 class="text-sm font-medium text-gray-500 mb-1">Section</h4>
						<p class="text-sm text-gray-900">{selectedAudition.participant.section.name}</p>
					</div>
					<div>
						<h4 class="text-sm font-medium text-gray-500 mb-1">Status</h4>
						{#if true}
							{@const badge = getStatusBadge(selectedAudition)}
							<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {badge.class}">
								{badge.icon} {badge.text}
							</span>
							{#if selectedAudition.is_submitted}
								<p class="text-xs text-gray-500 mt-1">
									Submitted on {formatDate(selectedAudition.submitted_at)}
								</p>
							{/if}
						{/if}
					</div>
					{#if selectedAudition.deadline}
						<div>
							<h4 class="text-sm font-medium text-gray-500 mb-1">Deadline</h4>
							<p class="text-sm text-gray-900">
								{formatDate(selectedAudition.deadline)}
							</p>
						</div>
					{/if}
				</div>

				<!-- Instructions -->
				{#if selectedAudition.instructions}
					<div class="mb-6">
						<h4 class="text-sm font-medium text-gray-500 mb-2">Instructions Given</h4>
						<div class="prose max-w-none text-sm text-gray-700 bg-gray-50 p-3 rounded">
							{@html selectedAudition.instructions}
						</div>
					</div>
				{/if}

				<!-- Required Files -->
				{#if selectedAudition.required_files && selectedAudition.required_files.length > 0}
					<div class="mb-6">
						<h4 class="text-sm font-medium text-gray-500 mb-2">Required Files</h4>
						<ul class="text-sm text-gray-700 list-disc list-inside bg-gray-50 p-3 rounded">
							{#each selectedAudition.required_files as file}
								<li>{file}</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Candidate Notes -->
				{#if selectedAudition.candidate_notes}
					<div class="mb-6">
						<h4 class="text-sm font-medium text-gray-500 mb-2">Candidate Notes</h4>
						<div class="text-sm text-gray-700 bg-blue-50 p-3 rounded">
							{selectedAudition.candidate_notes}
						</div>
					</div>
				{/if}

				<!-- Uploaded Files -->
				<div class="mb-6">
					<h4 class="text-sm font-medium text-gray-500 mb-2">
						Uploaded Files ({selectedAudition.files ? selectedAudition.files.length : 0})
						{#if selectedAudition.is_submitted}
							<span class="ml-2 text-green-600 font-medium">✅ Audition Complete</span>
						{/if}
					</h4>
					{#if selectedAudition.files && selectedAudition.files.length > 0}
						<div class="space-y-3">
							{#each selectedAudition.files as auditionFile}
								<div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 {isMobile ? 'flex-col items-start space-y-2' : ''}">
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
												<p class="font-medium text-gray-900 text-sm">{auditionFile.file.name}</p>
												<p class="text-xs text-gray-500">{auditionFile.description}</p>
												<p class="text-xs text-gray-400">
													{auditionFile.file_type} • Uploaded {formatDateShort(auditionFile.uploaded_at)}
												</p>
											</div>
										</div>
									</div>
									<button
										on:click={() => downloadFile(auditionFile.file.id, auditionFile.file.name)}
										class="{isMobile ? 'w-full' : ''} px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
									>
										📥 Download
									</button>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-gray-500 italic">No files uploaded</p>
					{/if}
				</div>

				<!-- Actions -->
				<div class="flex {isMobile ? 'flex-col space-y-2' : 'justify-between'}">
					<button
						on:click={() => goToValidation(selectedAudition.participant.id)}
						class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 {isMobile ? 'w-full' : ''}"
					>
						{selectedAudition.is_submitted ? '✅ Make Decision' : '⏳ Go to Validation'}
					</button>
					<button
						on:click={closeDetailsModal}
						class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 {isMobile ? 'w-full' : ''}"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- ✅ NOUVEAU : Modal de confirmation de suppression -->
{#if showDeleteModal && auditionToDelete}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-lg max-w-md w-full">
			<div class="px-6 py-4 border-b border-gray-200">
				<h3 class="text-lg font-medium text-gray-900">Confirm Audition Deletion</h3>
			</div>

			<div class="px-6 py-4">
				<div class="flex items-center mb-4">
					<div class="flex-shrink-0">
						<svg class="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.598 0L5.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
					</div>
					<div class="ml-4">
						<h4 class="text-lg font-medium text-gray-900">Delete Audition</h4>
						<p class="text-sm text-gray-500">This action cannot be undone.</p>
					</div>
				</div>

				<div class="bg-gray-50 p-4 rounded-lg mb-4">
					<h5 class="font-medium text-gray-900 mb-2">Audition Details:</h5>
					<p class="text-sm text-gray-700">
						<strong>Candidate:</strong> {auditionToDelete.participant.contact.firstName} {auditionToDelete.participant.contact.lastName}
					</p>
					<p class="text-sm text-gray-700">
						<strong>Section:</strong> {auditionToDelete.participant.section.name}
					</p>
					<p class="text-sm text-gray-700">
						<strong>Status:</strong>
						{#if auditionToDelete.is_submitted}
							<span class="text-green-600">Submitted</span>
						{:else}
							<span class="text-yellow-600">In Progress</span>
						{/if}
					</p>
					<p class="text-sm text-gray-700">
						<strong>Files:</strong> {auditionToDelete.files ? auditionToDelete.files.length : 0}
					</p>
				</div>

				<div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
					<div class="flex">
						<svg class="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
						</svg>
						<div class="ml-2">
							<h6 class="text-sm font-medium text-red-800">This will permanently:</h6>
							<ul class="text-sm text-red-700 list-disc list-inside mt-1">
								<li>Delete all uploaded files ({auditionToDelete.files ? auditionToDelete.files.length : 0} file{auditionToDelete.files && auditionToDelete.files.length > 1 ? 's' : ''})</li>
								<li>Remove the audition record</li>
								<li>Reset the participant's audition status</li>
							</ul>
						</div>
					</div>
				</div>
			</div>

			<div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
				<button
					on:click={closeDeleteModal}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
					disabled={isDeleting}
				>
					Cancel
				</button>
				<button
					on:click={confirmDeleteAudition}
					class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={isDeleting}
				>
					{#if isDeleting}
						<div class="flex items-center">
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							Deleting...
						</div>
					{:else}
						🗑️ Delete Audition
					{/if}
				</button>
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

    .bg-green-25 {
        background-color: rgba(34, 197, 94, 0.05);
    }

    /* Mobile optimizations */
    @media (max-width: 768px) {
        .prose {
            font-size: 0.875rem;
        }
    }
</style>