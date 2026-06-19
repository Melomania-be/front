<!-- src/routes/projects/[id]/management/recruitment/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte';
	import ProjectPhoneDisplayer from '../ProjectPhoneDisplayer.svelte';
	import RecruitmentSettings from '$lib/components/recruitment/RecruitmentSettings.svelte';
	import RecruitmentContactsList from '$lib/components/recruitment/RecruitmentContactsList.svelte';
	import RecruitmentStats from '$lib/components/recruitment/RecruitmentStats.svelte';
	import RecruitmentRecommendations from '$lib/components/recruitment/RecruitmentRecommendations.svelte';
	import AddManualContactModal from '$lib/components/recruitment/AddManualContactModal.svelte';
	import ImportContactsAdvancedModal from '$lib/components/recruitment/ImportContactsWorkingModal.svelte';
	import ImportProjectModal from '$lib/components/recruitment/ImportProjectModal.svelte';
	import { Plus, Users, Settings, Upload } from 'lucide-svelte';
	import type { Project } from '$lib/types/Project';
	import type {
		RecruitmentStats as StatsType,
		RecruitmentSettings as SettingsType
	} from '$lib/types';

	let project: Project | undefined;
	let settings: SettingsType | undefined;
	let stats: StatsType | undefined;
	let isMobile = false;
	let activeTab = 'contacts';
	let loading = false;
	let error = '';
	let hasPerformedInitialImport = false;

	let showAddManualModal = false;
	let showImportAdvancedModal = false;
	let showImportProjectModal = false;
	let showSettingsModal = false;

	let contactsListRef: any;

	$: projectId = $page.params.id;

	$: if (
		projectId &&
		(projectId === 'undefined' || projectId === 'null' || isNaN(Number(projectId)))
	) {
		console.error('Invalid project ID:', projectId);
		error = 'Invalid project ID';
		goto('/projects');
	}

	onMount(async () => {
		checkMobile();
		window.addEventListener('resize', checkMobile);

		if (projectId && projectId !== 'undefined' && !isNaN(Number(projectId))) {
			loadData();
			checkAndPerformInitialImport();
		} else {
			error = 'Missing or invalid project ID';
		}

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	function checkMobile() {
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth <= 1000;
		}
	}

	async function loadData() {
		try {
			await Promise.all([fetchProject(), fetchSettings(), fetchStats()]);
		} catch (err) {
			console.error('Error loading data:', err);
			error = 'Error loading data';
		}
	}

	async function checkAndPerformInitialImport() {
		if (hasPerformedInitialImport) return;

		try {
			const statsResponse = await fetch(`/api/projects/${projectId}/management/recruitment/stats`);

			if (statsResponse.ok) {
				const currentStats = await statsResponse.json();

				if (currentStats.total === 0) {
					const importResponse = await fetch(
						`/api/projects/${projectId}/management/recruitment/auto-import-all`,
						{
							method: 'POST',
							headers: { 'Content-Type': 'application/json' }
						}
					);

					if (importResponse.ok) {
						const importResults = await importResponse.json();

						if (importResults.new_imports > 0) {
							if (contactsListRef && contactsListRef.refreshContacts) {
								contactsListRef.refreshContacts();
							}
							fetchStats();
						}
					}
				}
			}

			hasPerformedInitialImport = true;
		} catch (error) {
			console.warn('Error during initial import check:', error);
			hasPerformedInitialImport = true;
		}
	}

	async function fetchProject() {
		try {
			const response = await fetch(`/api/projects/${projectId}`);

			if (response.ok) {
				project = await response.json();
			} else if (response.status === 404) {
				console.error('Project not found');
				error = 'Project not found';
				goto('/projects');
			} else {
				throw new Error(`HTTP ${response.status}`);
			}
		} catch (err) {
			console.error('Error fetching project:', err);
			throw err;
		}
	}

	async function fetchSettings() {
		try {
			console.log('Fetching settings for project:', projectId);
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/settings`);

			if (response.ok) {
				const data = await response.json();
				console.log('Settings received:', data);

				settings = {
					id: data.id || 0,
					project_id: data.project_id || Number(projectId),
					follow_up_days: Number(data.follow_up_days) || 7,
					auto_follow_up_enabled: Boolean(data.auto_follow_up_enabled),
					created_at: data.created_at || new Date().toISOString(),
					updated_at: data.updated_at || new Date().toISOString()
				};
				console.log('Settings processed:', settings);
			} else {
				console.warn('Could not fetch settings, using defaults. Status:', response.status);
				const errorText = await response.text();
				console.warn('Error response:', errorText);

				settings = {
					id: 0,
					project_id: Number(projectId),
					follow_up_days: 7,
					auto_follow_up_enabled: true,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				};
			}
		} catch (err) {
			console.error('Error fetching settings:', err);
			settings = {
				id: 0,
				project_id: Number(projectId),
				follow_up_days: 7,
				auto_follow_up_enabled: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};
		}
	}

	async function fetchStats() {
		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/stats`);

			if (response.ok) {
				const data = await response.json();

				const newStats = {
					total: Number(data.total) || 0,
					by_status: Array.isArray(data.by_status)
						? data.by_status.filter((item) => item && item.status)
						: [],
					pending_recommendations: Number(data.pending_recommendations) || 0
				};

				stats = newStats;
			} else {
				console.warn('Could not fetch stats, status:', response.status);
				stats = {
					total: 0,
					by_status: [],
					pending_recommendations: 0
				};
			}
		} catch (err) {
			console.error('Error fetching stats:', err);
			stats = {
				total: 0,
				by_status: [],
				pending_recommendations: 0
			};
		}
	}

	function handleSettingsUpdate(event) {
		console.log('Settings update event received:', event.detail);

		const newSettings = event.detail;
		if (newSettings) {
			settings = {
				id: newSettings.id || settings?.id || 0,
				project_id: newSettings.project_id || Number(projectId),
				follow_up_days: Number(newSettings.follow_up_days) || 7,
				auto_follow_up_enabled: Boolean(newSettings.auto_follow_up_enabled),
				created_at: newSettings.created_at || settings?.created_at || new Date().toISOString(),
				updated_at: newSettings.updated_at || new Date().toISOString()
			};
			console.log('Settings updated to:', settings);
		}

		showSettingsModal = false;

		setTimeout(async () => {
			await fetchStats();
			if (contactsListRef && contactsListRef.refreshContacts) {
				contactsListRef.refreshContacts();
			}
		}, 200);
	}

	function handleContactChange() {
		fetchStats();
	}

	function handleRecommendationChange() {
		fetchStats();
		if (contactsListRef && contactsListRef.refreshContacts) {
			contactsListRef.refreshContacts();
		}
	}

	function handleContactAdded(event) {
		if (contactsListRef && contactsListRef.refreshContacts) {
			contactsListRef.refreshContacts();
		}
		fetchStats();
		showAddManualModal = false;
	}

	function handleContactsImported(event) {
		if (contactsListRef && contactsListRef.refreshContacts) {
			contactsListRef.refreshContacts();
		}
		fetchStats();
		showImportAdvancedModal = false;
	}

	function handleProjectsImported(event) {
		if (contactsListRef && contactsListRef.refreshContacts) {
			contactsListRef.refreshContacts();
		}
		fetchStats();
		showImportProjectModal = false;
	}

	function openSettingsModal() {
		console.log('Opening settings modal with settings:', settings);
		if (!settings) {
			console.warn('No settings available, fetching first...');
			fetchSettings().then(() => {
				showSettingsModal = true;
			});
		} else {
			showSettingsModal = true;
		}
	}

	$: safeStats = stats || { total: 0, by_status: [], pending_recommendations: 0 };
	$: totalContacts = safeStats.total || 0;
	$: awaitingCount = safeStats.by_status?.find((s) => s.status === 'awaiting_response')?.count || 0;
	$: recruitedCount = safeStats.by_status?.find((s) => s.status === 'recruited')?.count || 0;
	$: pendingRecs = safeStats.pending_recommendations || 0;
	$: toFollowUpCount = safeStats.by_status?.find((s) => s.status === 'to_follow_up')?.count || 0;
</script>

<svelte:head>
	<title>Recruitment - {project?.name || 'Project'}</title>
</svelte:head>

{#if loading}
	<div class="min-h-screen bg-[#E7E7E7] flex items-center justify-center">
		<div class="text-center">
			<div
				class="animate-spin rounded-full h-16 w-16 border-b-2 border-[#6B9AD9] mx-auto mb-4"
			></div>
			<p class="text-gray-600">Loading recruitment system...</p>
		</div>
	</div>
{:else if error}
	<div class="min-h-screen bg-[#E7E7E7] flex items-center justify-center">
		<div class="bg-white rounded-lg shadow-lg p-8 text-center">
			<h1 class="text-2xl font-bold text-red-600 mb-4">Error</h1>
			<p class="text-gray-600 mb-4">{error}</p>
			<button
				on:click={() => goto('/projects')}
				class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4]"
			>
				Back to Projects
			</button>
		</div>
	</div>
{:else}
	<ProjectHeadDisplayer {project} selectedTab={7} />

	<div class="bg-[#E7E7E7] min-h-screen p-4 pb-[80px]">
		<div class="bg-white border-2 border-[#8C8C8C] rounded-lg p-6 mb-6">
			<div class="flex {isMobile ? 'flex-col gap-4' : 'items-center justify-between'} mb-6">
				<div>
					<h1 class="font-bold text-2xl uppercase">Recruitment Management</h1>
				</div>

				<div class="flex {isMobile ? 'flex-col' : 'flex-row'} gap-2">
					<button
						on:click={openSettingsModal}
						class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
					>
						<Settings size={16} />
						Settings
					</button>

					<button
						on:click={() => (showImportAdvancedModal = true)}
						class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
					>
						<Upload size={16} />
						Import Contacts
					</button>

					<button
						on:click={() => (showAddManualModal = true)}
						class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors flex items-center gap-2"
					>
						<Plus size={16} />
						Add Manual
					</button>

					<button
						on:click={() => (showImportProjectModal = true)}
						class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
					>
						<Users size={16} />
						Import Project
					</button>
				</div>
			</div>

			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div class="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
					<p class="text-lg font-bold text-blue-600">{totalContacts}</p>
					<p class="text-sm text-blue-600">Total Contacts</p>
				</div>

				<div class="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
					<p class="text-lg font-bold text-yellow-600">{awaitingCount + toFollowUpCount}</p>
					<p class="text-sm text-yellow-600">In Progress</p>
				</div>

				<div class="text-center p-3 bg-green-50 rounded-lg border border-green-200">
					<p class="text-lg font-bold text-green-600">{recruitedCount}</p>
					<p class="text-sm text-green-600">Recruited</p>
				</div>

				<div class="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
					<p class="text-lg font-bold text-purple-600">{pendingRecs}</p>
					<p class="text-sm text-purple-600">Recommendations</p>
				</div>
			</div>
		</div>

		{#if !isMobile}
			<div class="bg-white border-2 border-[#8C8C8C] rounded-lg mb-6">
				<div class="flex border-b">
					<button
						class="px-6 py-3 font-semibold {activeTab === 'contacts'
							? 'text-[#6B9AD9] border-b-2 border-[#6B9AD9]'
							: 'text-gray-600 hover:text-[#6B9AD9]'}"
						on:click={() => (activeTab = 'contacts')}
					>
						Contacts ({totalContacts})
					</button>

					<button
						class="px-6 py-3 font-semibold {activeTab === 'recommendations'
							? 'text-[#6B9AD9] border-b-2 border-[#6B9AD9]'
							: 'text-gray-600 hover:text-[#6B9AD9]'}"
						on:click={() => (activeTab = 'recommendations')}
					>
						Recommendations
						{#if pendingRecs > 0}
							<span class="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1"
								>{pendingRecs}</span
							>
						{/if}
					</button>

					<button
						class="px-6 py-3 font-semibold {activeTab === 'stats'
							? 'text-[#6B9AD9] border-b-2 border-[#6B9AD9]'
							: 'text-gray-600 hover:text-[#6B9AD9]'}"
						on:click={() => (activeTab = 'stats')}
					>
						Statistics
					</button>
				</div>
			</div>
		{/if}

		{#if (activeTab === 'contacts' || isMobile) && settings}
			<RecruitmentContactsList
				bind:this={contactsListRef}
				{projectId}
				{settings}
				on:contactChange={handleContactChange}
			/>
		{/if}

		{#if activeTab === 'recommendations' && !isMobile}
			<RecruitmentRecommendations
				{projectId}
				on:recommendationChange={handleRecommendationChange}
			/>
		{:else if isMobile && pendingRecs > 0}
			<div class="mt-6">
				<RecruitmentRecommendations
					{projectId}
					on:recommendationChange={handleRecommendationChange}
				/>
			</div>
		{/if}

		{#if activeTab === 'stats' && !isMobile && stats}
			<RecruitmentStats {stats} />
		{/if}

		{#if showSettingsModal && settings}
			<RecruitmentSettings
				{projectId}
				{settings}
				on:close={() => (showSettingsModal = false)}
				on:update={handleSettingsUpdate}
			/>
		{/if}

		{#if showAddManualModal}
			<AddManualContactModal
				{projectId}
				on:close={() => (showAddManualModal = false)}
				on:contactAdded={handleContactAdded}
			/>
		{/if}

		{#if showImportAdvancedModal}
			<ImportContactsAdvancedModal
				{projectId}
				on:close={() => (showImportAdvancedModal = false)}
				on:contactsImported={handleContactsImported}
			/>
		{/if}

		{#if showImportProjectModal}
			<ImportProjectModal
				{projectId}
				on:close={() => (showImportProjectModal = false)}
				on:projectsImported={handleProjectsImported}
			/>
		{/if}
	</div>

	{#if isMobile}
		<ProjectPhoneDisplayer {project} selectedTab={7} />
	{/if}
{/if}
