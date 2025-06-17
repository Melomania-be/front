<script lang="ts">
	import DateShow from '$lib/components/DateShow.svelte';
	import DisplayerEvents from './DisplayerEvents.svelte';
	import DisplayerFolder from './DisplayerFolder.svelte';
	import DisplayerPieces from './DisplayerPieces.svelte';
	import DisplayerSheets from './DisplayerSheets.svelte';
	import Notification from './Notification.svelte';
	import { onMount, onDestroy } from 'svelte';

	export let project: any;
	export let participantsNotSeenCallsheet: Array<any>;
	export let participantsNotValidated: Array<any>;
	export let participantsWithoutEmail: Array<any>;

	// Variables pour les auditions
	let auditionsStats: any = null;
	let loadingAuditions = false;
	let newSubmissionsCount = 0;
	let lastCheckedSubmissions = 0;
	let refreshInterval: any = null;

	onMount(async () => {
		await loadAuditionsStats();

		// Auto-refresh toutes les 2 minutes pour détecter nouvelles soumissions
		refreshInterval = setInterval(async () => {
			await loadAuditionsStats(true); // silent refresh
		}, 120000); // 2 minutes
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	async function loadAuditionsStats(silent = false) {
		if (!silent) {
			loadingAuditions = true;
		}

		try {
			const response = await fetch(`/api/projects/${project.id}/management/auditions`);
			if (response.ok) {
				const data = await response.json();

				// Détecter nouvelles soumissions
				if (auditionsStats && data.stats.submitted > auditionsStats.submitted) {
					newSubmissionsCount = data.stats.submitted - auditionsStats.submitted;
					showAuditionNotification();
				}

				auditionsStats = data.stats;
				lastCheckedSubmissions = data.stats.submitted;
			}
		} catch (error) {
			console.error('Error loading auditions stats:', error);
		} finally {
			if (!silent) {
				loadingAuditions = false;
			}
		}
	}

	function showAuditionNotification() {
		// Créer une notification pour les nouvelles soumissions
		const notification = document.createElement('div');
		notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm';
		notification.innerHTML = `
			<div class="flex items-center">
				<span class="text-2xl mr-3">🎯</span>
				<div>
					<h4 class="font-bold">${newSubmissionsCount} nouvelle${newSubmissionsCount > 1 ? 's' : ''} audition${newSubmissionsCount > 1 ? 's' : ''} !</h4>
					<p class="text-sm opacity-90">Cliquez pour voir les détails</p>
				</div>
			</div>
		`;

		notification.style.cursor = 'pointer';
		notification.onclick = () => {
			window.location.href = `/projects/${project.id}/management/auditions`;
		};

		document.body.appendChild(notification);

		// Animation d'apparition
		notification.style.transform = 'translateX(100%)';
		setTimeout(() => {
			notification.style.transition = 'transform 0.3s ease-out';
			notification.style.transform = 'translateX(0)';
		}, 100);

		// Disparition automatique après 8 secondes
		setTimeout(() => {
			notification.style.transition = 'transform 0.3s ease-in, opacity 0.3s ease-in';
			notification.style.transform = 'translateX(100%)';
			notification.style.opacity = '0';
			setTimeout(() => {
				if (notification.parentNode) {
					notification.remove();
				}
			}, 300);
		}, 8000);

		// Reset du compteur
		newSubmissionsCount = 0;
	}

	function goToAuditions() {
		window.location.href = `/projects/${project.id}/management/auditions`;
	}
</script>

<div class="w-full">
	<Notification bind:participantsWithoutEmail bind:project bind:participantsNotValidated />

	<!-- Alerte pour les auditions si il y en a -->
	{#if auditionsStats && (auditionsStats.submitted > 0 || auditionsStats.pending > 0)}
		<div class="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg shadow-sm">
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<span class="text-2xl mr-3">🎭</span>
					<div>
						<h3 class="font-bold text-purple-900">État des auditions</h3>
						<div class="flex items-center space-x-4 text-sm text-purple-700">
							{#if auditionsStats.submitted > 0}
								<span class="flex items-center">
									<span class="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
									{auditionsStats.submitted} soumise{auditionsStats.submitted > 1 ? 's' : ''}
								</span>
							{/if}
							{#if auditionsStats.pending > 0}
								<span class="flex items-center">
									<span class="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
									{auditionsStats.pending} en cours
								</span>
							{/if}
							{#if auditionsStats.expired > 0}
								<span class="flex items-center">
									<span class="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
									{auditionsStats.expired} expirée{auditionsStats.expired > 1 ? 's' : ''}
								</span>
							{/if}
						</div>
					</div>
				</div>
				<div class="flex space-x-2">
					{#if auditionsStats.submitted > 0}
						<span class="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
							🎯 Prêtes à évaluer
						</span>
					{/if}
					<button
						on:click={goToAuditions}
						class="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
					>
						Gérer les auditions
					</button>
				</div>
			</div>
		</div>
	{/if}

	<div class="flex flex-col md:flex-row">
		<div
			class="flex-col space-y-1 w-full md:w-5/12 m-1 p-6 bg-white border border-black rounded-tl-lg shadow dark:bg-gray-800 dark:border-gray-700"
		>
			<div class="text-sm">
				Created at: <DateShow startTime={project.createdAt} />
			</div>
			<div class="text-sm">
				Updated at: <DateShow startTime={project.updatedAt} />
			</div>
			<div class="text-sm">
				Project managers:
				{#if project.responsibles && project.responsibles.length === 0}
					No project manager
				{:else}
					{#each project.responsibles as responsible}
						<a href="/contacts/{responsible.id}" class="rounded-full bg-slate-100 p-1"
						>{responsible.firstName} {responsible.lastName}</a
						>
					{/each}
				{/if}
			</div>
			<div class="grid grid-cols-2 gap-1">
				<a
					href="/projects/{project.id}/management/modify"
					class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					Modify project infos
				</a>
				<a
					href="/projects/{project.id}/management/participants"
					class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					Participants
				</a>
				<a
					href="/projects/{project.id}/management/attendance"
					class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					See attendance
				</a>
				<a
					href="/projects/{project.id}/management/mailing"
					class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					Mail manager
				</a>
				<a
					href="/projects/{project.id}/management/callsheets"
					class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					See all callsheets
				</a>
				<a
					href="/projects/{project.id}/management/validation"
					class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					New participant validation
				</a>
				<!-- Bouton pour la gestion des auditions avec badge si nouvelles soumissions -->
				<a
					href="/projects/{project.id}/management/auditions"
					class="relative inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-purple-700 rounded-lg hover:bg-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-800"
				>
					Gestion des auditions
					{#if auditionsStats && auditionsStats.submitted > 0}
						<span class="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
							{auditionsStats.submitted}
						</span>
					{/if}
				</a>
			</div>

			<!-- Section statistiques auditions détaillées -->
			{#if auditionsStats && auditionsStats.total > 0}
				<div class="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
					<h4 class="text-sm font-bold text-purple-900 mb-2">📊 Résumé des auditions</h4>
					<div class="grid grid-cols-2 gap-2 text-xs">
						<div class="text-purple-700">
							<span class="font-medium">Total :</span> {auditionsStats.total}
						</div>
						<div class="text-green-700">
							<span class="font-medium">Soumises :</span> {auditionsStats.submitted}
						</div>
						<div class="text-yellow-700">
							<span class="font-medium">En cours :</span> {auditionsStats.pending}
						</div>
						<div class="text-purple-700">
							<span class="font-medium">Fichiers :</span> {auditionsStats.totalFiles}
						</div>
					</div>
					{#if auditionsStats.submitted > 0}
						<div class="mt-2 text-xs text-green-600 font-medium">
							✅ {auditionsStats.submitted} audition{auditionsStats.submitted > 1 ? 's' : ''} prête{auditionsStats.submitted > 1 ? 's' : ''} à évaluer
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<div class="m-1 w-full md:w-7/12">
			<DisplayerPieces bind:project />
		</div>
	</div>

	<div class="flex flex-col md:flex-row">
		<div class="m-1 w-full md:w-1/2">
			<DisplayerSheets
				bind:project
				bind:participantsSeenCallsheet={participantsNotSeenCallsheet}
				bind:participantsNotValidated
			/>
		</div>
		<div class="m-1 w-full md:w-1/2">
			<DisplayerEvents bind:project />
		</div>
	</div>

	<div class="flex flex-col md:flex-row">
		<div class="m-1 w-full md:w-1/2">
			<DisplayerFolder bind:project />
		</div>
	</div>
</div>