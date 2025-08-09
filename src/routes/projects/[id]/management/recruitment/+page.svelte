<!-- src/routes/projects/[id]/management/recruitment/+page.svelte - Version avec synchronisation corrigée -->
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
	import ImportContactsModal from '$lib/components/recruitment/ImportContactsModal.svelte'
	import AddManualContactModal from '$lib/components/recruitment/AddManualContactModal.svelte'
	import { Plus, Upload, Users, Settings, TrendingUp, UserPlus } from 'lucide-svelte'
	import type { Project } from '$lib/types/Project'
	import type { RecruitmentStats as StatsType, RecruitmentSettings as SettingsType } from '$lib/types'

	export let data

	let project: Project | undefined
	let settings: SettingsType | undefined
	let stats: StatsType | undefined
	let pendingRecommendations: number = 0
	let isMobile = false
	let activeTab = 'contacts'
	let loading = true
	let error = ''

	// Modals
	let showImportModal = false
	let showAddManualModal = false
	let showSettingsModal = false

	// Auto-refresh stats every 10 seconds pour garder sync
	let statsRefreshInterval: any

	$: projectId = $page.params.id

	// Protection robuste contre les IDs invalides
	$: if (projectId && (projectId === 'undefined' || projectId === 'null' || isNaN(Number(projectId)))) {
		console.error('❌ Invalid project ID:', projectId)
		error = 'ID de projet invalide'
		goto('/projects')
	}

	onMount(async () => {
		console.log('🔄 Initializing recruitment page for project:', projectId)
		checkMobile()
		window.addEventListener('resize', checkMobile)

		if (projectId && projectId !== 'undefined' && !isNaN(Number(projectId))) {
			await loadData()

			// Démarrer l'auto-refresh des stats pour la synchronisation
			statsRefreshInterval = setInterval(() => {
				console.log('🔄 Auto-refreshing stats for sync...')
				fetchStats()
			}, 10000) // Refresh toutes les 10 secondes
		} else {
			error = 'ID de projet manquant ou invalide'
		}

		loading = false

		return () => {
			window.removeEventListener('resize', checkMobile)
			if (statsRefreshInterval) {
				clearInterval(statsRefreshInterval)
			}
		}
	})

	function checkMobile() {
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth <= 1000
		}
	}

	async function loadData() {
		try {
			console.log('📊 Loading recruitment data...')
			await Promise.all([
				fetchProject(),
				fetchSettings(),
				fetchStats()
			])
			console.log('✅ All data loaded successfully')
		} catch (err) {
			console.error('❌ Error loading data:', err)
			error = 'Erreur lors du chargement des données'
		}
	}

	async function fetchProject() {
		try {
			console.log('🔍 Fetching project data...')
			const response = await fetch(`/api/projects/${projectId}`)

			if (response.ok) {
				project = await response.json()
				console.log('✅ Project loaded:', project?.name)
			} else if (response.status === 404) {
				console.error('❌ Project not found')
				error = 'Projet non trouvé'
				goto('/projects')
			} else {
				throw new Error(`HTTP ${response.status}`)
			}
		} catch (err) {
			console.error('❌ Error fetching project:', err)
			throw err
		}
	}

	async function fetchSettings() {
		try {
			console.log('⚙️ Fetching recruitment settings...')
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/settings`)

			if (response.ok) {
				settings = await response.json()
				console.log('✅ Settings loaded:', settings)
			} else {
				console.warn('⚠️ Could not fetch settings, using defaults')
				// Créer des paramètres par défaut en cas d'erreur
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
			console.error('❌ Error fetching settings:', err)
			// Utiliser des paramètres par défaut
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
			console.log('📈 Fetching recruitment stats...')
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/stats`)

			if (response.ok) {
				const data = await response.json()

				// Protection maximale contre les données corrompues
				const newStats = {
					total: Number(data.total) || 0,
					by_status: Array.isArray(data.by_status) ? data.by_status.filter(item => item && item.status) : [],
					pending_recommendations: Number(data.pending_recommendations) || 0
				}

				// Mise à jour des stats seulement si elles ont vraiment changé
				if (!stats ||
					stats.total !== newStats.total ||
					stats.pending_recommendations !== newStats.pending_recommendations ||
					JSON.stringify(stats.by_status) !== JSON.stringify(newStats.by_status)) {

					stats = newStats
					pendingRecommendations = stats.pending_recommendations
					console.log('✅ Stats updated:', stats)
				}
			} else {
				console.warn('⚠️ Could not fetch stats, using defaults')
				// Statistiques par défaut en cas d'erreur
				if (!stats) {
					stats = {
						total: 0,
						by_status: [],
						pending_recommendations: 0
					}
					pendingRecommendations = 0
				}
			}
		} catch (err) {
			console.error('❌ Error fetching stats:', err)
			// Statistiques par défaut seulement si pas encore définies
			if (!stats) {
				stats = {
					total: 0,
					by_status: [],
					pending_recommendations: 0
				}
				pendingRecommendations = 0
			}
		}
	}

	function handleSettingsUpdate() {
		console.log('🔄 Refreshing settings and stats after settings update...')
		fetchSettings()
		fetchStats()
	}

	function handleContactChange() {
		console.log('🔄 Refreshing stats after contact change...')
		// Refresh immédiat + trigger update dans les composants parents
		fetchStats()

		// Force le re-render des statistiques
		setTimeout(() => {
			stats = { ...stats }
		}, 100)
	}

	function handleRecommendationChange() {
		console.log('🔄 Refreshing stats after recommendation change...')
		fetchStats()

		// Force le re-render
		setTimeout(() => {
			stats = { ...stats }
		}, 100)
	}

	// Valeurs sécurisées pour l'affichage avec synchronisation
	$: safeStats = stats || { total: 0, by_status: [], pending_recommendations: 0 }
	$: totalContacts = safeStats.total || 0
	$: awaitingCount = safeStats.by_status?.find(s => s.status === 'awaiting_response')?.count || 0
	$: recruitedCount = safeStats.by_status?.find(s => s.status === 'recruited')?.count || 0
	$: pendingRecs = safeStats.pending_recommendations || 0

	// Réactivité pour forcer les updates
	$: if (stats) {
		pendingRecommendations = stats.pending_recommendations
	}
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
		<!-- Header avec statistiques et actions - Valeurs synchronisées -->
		<div class="grid {isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'} gap-4 mb-6">
			<!-- Statistiques rapides avec protection contre undefined et synchronisation -->
			<div class="bg-white rounded-lg border-2 border-[#6B9AD9] p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-600 uppercase font-semibold">Total Contacts</p>
						<p class="text-2xl font-bold text-[#6B9AD9]">{totalContacts}</p>
					</div>
					<Users class="text-[#6B9AD9]" size={24} />
				</div>
			</div>

			<div class="bg-white rounded-lg border-2 border-[#E35656] p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-600 uppercase font-semibold">En attente</p>
						<p class="text-2xl font-bold text-[#E35656]">{awaitingCount}</p>
					</div>
					<TrendingUp class="text-[#E35656]" size={24} />
				</div>
			</div>

			<div class="bg-white rounded-lg border-2 border-[#28a745] p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-600 uppercase font-semibold">Recrutés</p>
						<p class="text-2xl font-bold text-[#28a745]">{recruitedCount}</p>
					</div>
					<UserPlus class="text-[#28a745]" size={24} />
				</div>
			</div>

			<div class="bg-white rounded-lg border-2 border-[#ffc107] p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-600 uppercase font-semibold">Recommandations</p>
						<p class="text-2xl font-bold text-[#ffc107]">{pendingRecs}</p>
					</div>
					<div class="relative">
						<Users class="text-[#ffc107]" size={24} />
						{#if pendingRecs > 0}
							<div class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
								{pendingRecs}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Actions principales -->
		<div class="bg-white border-2 border-[#8C8C8C] rounded-lg p-4 mb-6">
			<div class="flex {isMobile ? 'flex-col gap-3' : 'items-center justify-between'}">
				<h1 class="font-bold text-lg uppercase">Gestion du Recrutement</h1>

				<div class="flex {isMobile ? 'flex-col' : 'flex-row'} gap-2">
					<button
						on:click={() => showSettingsModal = true}
						class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
					>
						<Settings size={16} />
						Paramètres
					</button>

					<button
						on:click={() => showAddManualModal = true}
						class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors flex items-center gap-2"
					>
						<Plus size={16} />
						Ajouter Contact
					</button>

					<button
						on:click={() => showImportModal = true}
						class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
					>
						<Upload size={16} />
						Importer Contacts
					</button>

					<button
						on:click={() => goto(`/projects/${projectId}/recruitment/import-project`)}
						class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
					>
						<Users size={16} />
						Importer Projet
					</button>
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
			<!-- Key pour forcer le re-render du composant stats -->
			{#key stats.total + stats.pending_recommendations + JSON.stringify(stats.by_status)}
				<RecruitmentStats {stats} />
			{/key}
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
				on:contactAdded={handleContactChange}
			/>
		{/if}

		{#if showImportModal}
			<ImportContactsModal
				{projectId}
				on:close={() => showImportModal = false}
				on:contactsImported={handleContactChange}
			/>
		{/if}
	</div>

	{#if isMobile}
		<ProjectPhoneDisplayer {project} selectedTab={6} />
	{/if}
{/if}