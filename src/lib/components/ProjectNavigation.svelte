<!-- src/lib/components/ProjectNavigation.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	export let projectId: string;
	export let projectName: string = '';

	// Déterminer l'onglet actif basé sur l'URL
	$: currentPath = $page.url.pathname;
	$: activeTab = getActiveTab(currentPath);

	function getActiveTab(path: string): string {
		if (path.includes('/management/validation')) return 'validation';
		if (path.includes('/management/auditions')) return 'auditions';
		if (path.includes('/management/participants')) return 'participants';
		if (path.includes('/management/callsheets')) return 'callsheets';
		if (path.includes('/management/attendance')) return 'attendance';
		if (path.includes('/management/registration')) return 'registration';
		if (path.includes('/management/mailing')) return 'mailing';
		if (path.includes('/management')) return 'dashboard';
		return 'dashboard';
	}

	function isActive(tab: string): boolean {
		return activeTab === tab;
	}

	function navigateTo(tab: string) {
		const routes = {
			dashboard: `/projects/${projectId}/management`,
			validation: `/projects/${projectId}/management/validation`,
			auditions: `/projects/${projectId}/management/auditions`,
			participants: `/projects/${projectId}/management/participants`,
			callsheets: `/projects/${projectId}/management/callsheets`,
			attendance: `/projects/${projectId}/management/attendance`,
			registration: `/projects/${projectId}/management/registration`,
			mailing: `/projects/${projectId}/management/mailing`
		};

		goto(routes[tab] || routes.dashboard);
	}
</script>

<div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- En-tête du projet -->
		<div class="py-4 border-b border-gray-200 dark:border-gray-700">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
						{projectName || `Projet #${projectId}`}
					</h1>
					<p class="text-sm text-gray-500 dark:text-gray-400">Gestion du projet</p>
				</div>
				<button
					on:click={() => goto('/projects')}
					class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
				>
					← Retour aux projets
				</button>
			</div>
		</div>

		<!-- Navigation des onglets -->
		<nav class="flex space-x-8 py-4 overflow-x-auto">
			<button
				on:click={() => navigateTo('dashboard')}
				class="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap {isActive('dashboard')
					? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
					: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
				</svg>
				<span>Tableau de bord</span>
			</button>

			<button
				on:click={() => navigateTo('validation')}
				class="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap {isActive('validation')
					? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
					: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
				<span>Validation</span>
			</button>

			<button
				on:click={() => navigateTo('auditions')}
				class="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap {isActive('auditions')
					? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
					: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
				</svg>
				<span>Auditions</span>
			</button>

			<button
				on:click={() => navigateTo('participants')}
				class="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap {isActive('participants')
					? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
					: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
				</svg>
				<span>Participants</span>
			</button>

			<button
				on:click={() => navigateTo('callsheets')}
				class="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap {isActive('callsheets')
					? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
					: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
				</svg>
				<span>Callsheets</span>
			</button>

			<button
				on:click={() => navigateTo('attendance')}
				class="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap {isActive('attendance')
					? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
					: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
				</svg>
				<span>Présences</span>
			</button>

			<button
				on:click={() => navigateTo('registration')}
				class="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap {isActive('registration')
					? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300'
					: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
				</svg>
				<span>Inscription</span>
			</button>

			<button
				on:click={() => navigateTo('mailing')}
				class="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap {isActive('mailing')
					? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
					: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
				</svg>
				<span>Mailing</span>
			</button>
		</nav>
	</div>
</div>