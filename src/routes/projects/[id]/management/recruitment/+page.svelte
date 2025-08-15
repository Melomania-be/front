<!-- src/routes/projects/[id]/management/recruitment/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores'
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte'
	import ProjectPhoneDisplayer from '../ProjectPhoneDisplayer.svelte'
	import RecruitmentSettings from '$lib/components/recruitment/RecruitmentSettings.svelte'
	import RecruitmentContactsList from '$lib/components/recruitment/RecruitmentContactsList.svelte'
	import RecruitmentStats from '$lib/components/recruitment/RecruitmentStats.svelte'
	import RecruitmentRecommendations from '$lib/components/recruitment/RecruitmentRecommendations.svelte'
	import AddManualContactModal from '$lib/components/recruitment/AddManualContactModal.svelte'
	import ImportContactsAdvancedModal from '$lib/components/recruitment/ImportContactsWorkingModal.svelte'
	import { Plus, Users, Settings, Upload } from 'lucide-svelte'
	import type { Project } from '$lib/types/Project'
	import type { RecruitmentStats as StatsType, RecruitmentSettings as SettingsType } from '$lib/types'

	export let data

	let project: Project | undefined
	let settings: SettingsType | undefined
	let stats: StatsType | undefined
	let isMobile = false
	let activeTab = 'contacts'
	let loading = true
	let error = ''
	let initialImportDone = false

	// Modals
	let showAddManualModal = false
	let showImportAdvancedModal = false
	let showSettingsModal = false

	let contactsListRef: any

	$: projectId = $page.params.id

	$: if (projectId && (projectId === 'undefined' || projectId === 'null' || isNaN(Number(projectId)))) {
		console.error('Invalid project ID:', projectId)
		error = 'ID de projet invalide'
		goto('/projects')
	}

	onMount(async () => {
		checkMobile()
		window.addEventListener('resize', checkMobile)

		if (projectId && projectId !== 'undefined' && !isNaN(Number(projectId))) {
			await loadData()
			await autoImportAllContacts()
		} else {
			error = 'ID de projet manquant ou invalide'
		}

		loading = false

		return () => {
			window.removeEventListener('resize', checkMobile)
		}
	})

	function checkMobile() {
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth <= 1000
		}
	}

	async function loadData() {
		try {
			await Promise.all([
				fetchProject(),
				fetchSettings(),
				fetchStats()
			])
		} catch (err) {
			console.error('Error loading data:', err)
			error = 'Erreur lors du chargement des données'
		}
	}

	async function autoImportAllContacts() {
		if (initialImportDone) return

		try {
			const importResponse = await fetch(`/api/projects/${projectId}/management/recruitment/auto-import-all`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			})

			if (importResponse.ok) {
				const importResults = await importResponse.json()

				if (importResults.new_imports > 0) {
					if (contactsListRef && contactsListRef.refreshContacts) {
						contactsListRef.refreshContacts()
					}
					fetchStats()
				}
			}

			initialImportDone = true
		} catch (error) {
			console.warn('Error during auto-import:', error)
			initialImportDone = true
		}
	}

	async function fetchProject() {
		try {
			const response = await fetch(`/api/projects/${projectId}`)

			if (response.ok) {
				project = await response.json()
			} else if (response.status === 404) {
				console.error('Project not found')
				error = 'Projet non trouvé'
				goto('/projects')
			} else {
				throw new Error(`HTTP ${response.status}`)
			}
		} catch (err) {
			console.error('Error fetching project:', err)
			throw err
		}
	}

	async function fetchSettings() {
		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/settings`)

			if (response.ok) {
				const data = await response.json()
				settings = {
					id: data.id || 0,
					project_id: data.project_id || Number(projectId),
					follow_up_days: data.follow_up_days || 7,
					auto_follow_up_enabled: data.auto_follow_up_enabled !== undefined ? data.auto_follow_up_enabled : true,
					created_at: data.created_at || new Date().toISOString(),
					updated_at: data.updated_at || new Date().toISOString()
				}
			} else {
				console.warn('Could not fetch settings, using defaults')
				settings = {
					id: 0,
					project_id: Number(projectId),
					follow_up_days: 7,
					auto_follow_up_enabled: true,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				}
			}
		} catch (err) {
			console.error('Error fetching settings:', err)
			settings = {
				id: 0,
				project_id: Number(projectId),
				follow_up_days: 7,
				auto_follow_up_enabled: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			}
		}
	}

	async function fetchStats() {
		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/stats`)

			if (response.ok) {
				const data = await response.json()

				const newStats = {
					total: Number(data.total) || 0,
					by_status: Array.isArray(data.by_status) ? data.by_status.filter(item => item && item.status) : [],
					pending_recommendations: Number(data.pending_recommendations) || 0
				}

				stats = newStats
			} else {
				console.warn('Could not fetch stats, status:', response.status)
				stats = {
					total: 0,
					by_status: [],
					pending_recommendations: 0
				}
			}
		} catch (err) {
			console.error('Error fetching stats:', err)
			stats = {
				total: 0,
				by_status: [],
				pending_recommendations: 0
			}
		}
	}

	function handleSettingsUpdate() {
		setTimeout(async () => {
			await Promise.all([fetchSettings(), fetchStats()])
			if (contactsListRef && contactsListRef.refreshContacts) {
				contactsListRef.refreshContacts()
			}
		}, 200)
	}

	function handleContactChange() {
		fetchStats()
	}

	function handleRecommendationChange() {
		fetchStats()
		if (contactsListRef && contactsListRef.refreshContacts) {
			contactsListRef.refreshContacts()
		}
	}

	function handleContactAdded(event) {
		if (contactsListRef && contactsListRef.refreshContacts) {
			contactsListRef.refreshContacts()
		}
		fetchStats()
		showAddManualModal = false
	}

	function handleContactsImported(event) {
		if (contactsListRef && contactsListRef.refreshContacts) {
			contactsListRef.refreshContacts()
		}
		fetchStats()
		showImportAdvancedModal = false
	}

	$: safeStats = stats || { total: 0, by_status: [], pending_recommendations: 0 }
	$: totalContacts = safeStats.total || 0
	$: awaitingCount = safeStats.by_status?.find(s => s.status === 'awaiting_response')?.count || 0
	$: recruitedCount = safeStats.by_status?.find(s => s.status === 'recruited')?.count || 0
	$: pendingRecs = safeStats.pending_recommendations || 0
	$: toFollowUpCount = safeStats.by_status?.find(s => s.status === 'to_follow_up')?.count || 0
</script>

<svelte:head>
	<title>Recrutement - {project?.name || 'Projet'}</title>
</svelte:head>

{#if loading}
	<div class="min-h-screen bg-[#E7E7E7] flex items-center justify-center">
		<div class="text-center">
			<div class="animate-spin rounded-full h-16 w-16 border-b-2 border-[#6B9AD9] mx-auto mb-4"></div>
			<p class="text-gray-600">Chargement du système de recrutement...</p>
		</div>
	</div>
{:else if error}
	<div class="min-h-screen bg-[#E7E7E7] flex items-center justify-center">
		<div class="bg-white rounded-lg shadow-lg p-8 text-center">
			<h1 class="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
			<p class="text-gray-600 mb-4">{error}</p>
			<button
				on:click={() => goto('/projects')}
				class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4]"
			>
				Retour aux projets
			</button>
		</div>
	</div>
{:else}
	<ProjectHeadDisplayer {project} selectedTab={6} />

	<div class="bg-[#E7E7E7] min-h-screen p-4 pb-[80px]">
		<!-- Header avec nouveau bouton Import Avancé -->
		<div class="bg-white border-2 border-[#8C8C8C] rounded-lg p-6 mb-6">
			<div class="flex {isMobile ? 'flex-col gap-4' : 'items-center justify-between'} mb-6">
				<div>
					<h1 class="font-bold text-2xl uppercase">Gestion du Recrutement</h1>
					<p class="text-sm text-gray-600 mt-2">
						Importez des contacts depuis la base de données avec recherche avancée ou ajoutez-les manuellement
					</p>
				</div>

				<div class="flex {isMobile ? 'flex-col' : 'flex-row'} gap-2">
					<button
						on:click={() => showSettingsModal = true}
						class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
					>
						<Settings size={16} />
						Paramètres
					</button>

					<button
						on:click={() => showImportAdvancedModal = true}
						class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
					>
						<Upload size={16} />
						Importer Contacts
					</button>

					<button
						on:click={() => showAddManualModal = true}
						class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors flex items-center gap-2"
					>
						<Plus size={16} />
						Ajouter Manuel
					</button>

					<button
						on:click={() => goto(`/projects/${projectId}/management/recruitment/import-project`)}
						class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
					>
						<Users size={16} />
						Importer Projet
					</button>
				</div>
			</div>

			<!-- Statistiques rapides -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div class="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
					<p class="text-lg font-bold text-blue-600">{totalContacts}</p>
					<p class="text-sm text-blue-600">Total Contacts</p>
				</div>

				<div class="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
					<p class="text-lg font-bold text-yellow-600">{awaitingCount + toFollowUpCount}</p>
					<p class="text-sm text-yellow-600">En cours</p>
				</div>

				<div class="text-center p-3 bg-green-50 rounded-lg border border-green-200">
					<p class="text-lg font-bold text-green-600">{recruitedCount}</p>
					<p class="text-sm text-green-600">Recrutés</p>
				</div>

				<div class="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
					<p class="text-lg font-bold text-purple-600">{pendingRecs}</p>
					<p class="text-sm text-purple-600">Recommandations</p>
				</div>
			</div>
		</div>

		<!-- Onglets -->
		{#if !isMobile}
			<div class="bg-white border-2 border-[#8C8C8C] rounded-lg mb-6">
				<div class="flex border-b">
					<button
						class="px-6 py-3 font-semibold {activeTab === 'contacts' ? 'text-[#6B9AD9] border-b-2 border-[#6B9AD9]' : 'text-gray-600 hover:text-[#6B9AD9]'}"
						on:click={() => activeTab = 'contacts'}
					>
						Contacts ({totalContacts})
					</button>

					<button
						class="px-6 py-3 font-semibold {activeTab === 'recommendations' ? 'text-[#6B9AD9] border-b-2 border-[#6B9AD9]' : 'text-gray-600 hover:text-[#6B9AD9]'}"
						on:click={() => activeTab = 'recommendations'}
					>
						Recommandations
						{#if pendingRecs > 0}
							<span class="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">{pendingRecs}</span>
						{/if}
					</button>

					<button
						class="px-6 py-3 font-semibold {activeTab === 'stats' ? 'text-[#6B9AD9] border-b-2 border-[#6B9AD9]' : 'text-gray-600 hover:text-[#6B9AD9]'}"
						on:click={() => activeTab = 'stats'}
					>
						Statistiques
					</button>
				</div>
			</div>
		{/if}

		<!-- Contenu des onglets -->
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

		<!-- Modals -->
		{#if showSettingsModal && settings}
			<RecruitmentSettings
				{projectId}
				{settings}
				on:close={() => showSettingsModal = false}
				on:update={handleSettingsUpdate}
			/>
		{/if}

		{#if showAddManualModal}
			<AddManualContactModal
				{projectId}
				on:close={() => showAddManualModal = false}
				on:contactAdded={handleContactAdded}
			/>
		{/if}

		{#if showImportAdvancedModal}
			<ImportContactsAdvancedModal
				{projectId}
				on:close={() => showImportAdvancedModal = false}
				on:contactsImported={handleContactsImported}
			/>
		{/if}
	</div>

	{#if isMobile}
		<ProjectPhoneDisplayer {project} selectedTab={6} />
	{/if}
{/if}