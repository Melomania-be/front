<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import type { Project } from '$lib/types/Project';
	import { onMount } from 'svelte';
	import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte';
	import ProjectPhoneDisplayer from '../ProjectPhoneDisplayer.svelte';

	export let data;

	let project: Project | undefined;

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

	onMount(async () => {
		await fetchProject();
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

	// Fonctions pour la gestion des auditions (à implémenter plus tard)
	function createAudition() {
		// Logique pour créer une audition
		console.log('Create audition');
	}

	function manageAuditions() {
		// Logique pour gérer les auditions
		console.log('Manage auditions');
	}

	function viewResults() {
		// Logique pour voir les résultats
		console.log('View results');
	}
</script>

<ProjectHeadDisplayer {project} selectedTab={5} />

<div class="bg-[#E7E7E7] p-4 min-h-screen {isMobile ? 'pb-[80px]' : ''}">
	<!-- Section principale avec le même style que le dashboard -->
	<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
		<div class="flex items-center mb-6">
			<h1 class="font-bold text-lg">AUDITIONS MANAGEMENT</h1>
			<div class="ml-auto mr-0">
				{#if project?.id}
					<a
						class="text-white font-bold text-sm bg-[#6B9AD9] p-2 rounded-[8px] hover:bg-blue-700"
						href="/projects/{project.id}/management/modify"
					>
						Settings
					</a>
				{:else}
					<span class="text-gray-400 font-bold text-sm bg-gray-300 p-2 rounded-[8px] cursor-not-allowed">
						Settings
					</span>
				{/if}
			</div>
		</div>

		<!-- Grille des fonctionnalités comme dans le dashboard -->
		<div class="grid {isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-6'} mb-6">
			<!-- Card 1 - Créer une audition -->
			<div class="bg-gradient-to-br from-[#6CB1C8] to-[#5077BA] rounded-[10px] p-6 text-white cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105" on:click={createAudition}>
				<div class="flex items-center justify-between">
					<div>
						<h3 class="font-bold text-lg mb-2">Create Audition</h3>
						<p class="text-sm opacity-90">Set up new audition sessions</p>
					</div>
					<div class="text-3xl opacity-80">🎭</div>
				</div>
				<div class="mt-4 flex items-center text-sm opacity-90">
					<span>Click to start</span>
					<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
					</svg>
				</div>
			</div>

			<!-- Card 2 - Gérer les auditions -->
			<div class="bg-gradient-to-br from-[#5077BA] to-[#353DAD] rounded-[10px] p-6 text-white cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105" on:click={manageAuditions}>
				<div class="flex items-center justify-between">
					<div>
						<h3 class="font-bold text-lg mb-2">Manage Sessions</h3>
						<p class="text-sm opacity-90">View and organize auditions</p>
					</div>
					<div class="text-3xl opacity-80">📋</div>
				</div>
				<div class="mt-4 flex items-center text-sm opacity-90">
					<span>Coming soon</span>
					<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
				</div>
			</div>

			<!-- Card 3 - Résultats -->
			<div class="bg-gradient-to-br from-[#353DAD] to-[#6B9AD9] rounded-[10px] p-6 text-white cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105" on:click={viewResults}>
				<div class="flex items-center justify-between">
					<div>
						<h3 class="font-bold text-lg mb-2">View Results</h3>
						<p class="text-sm opacity-90">Analyze audition outcomes</p>
					</div>
					<div class="text-3xl opacity-80">📊</div>
				</div>
				<div class="mt-4 flex items-center text-sm opacity-90">
					<span>Coming soon</span>
					<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
					</svg>
				</div>
			</div>
		</div>

		<!-- Section informative comme dans le dashboard -->
		<div class="grid {isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-6'}">
			<!-- Info panel -->
			<div class="border-[#8C8C8C] rounded-[10px] border-2 bg-white p-4">
				<div class="flex items-center mb-4">
					<h2 class="font-bold text-lg">AUDITION FEATURES</h2>
				</div>
				<div class="space-y-3 text-sm text-gray-600">
					<div class="flex items-center">
						<span class="w-2 h-2 bg-[#6CB1C8] rounded-full mr-3"></span>
						<span>Schedule and organize audition sessions</span>
					</div>
					<div class="flex items-center">
						<span class="w-2 h-2 bg-[#5077BA] rounded-full mr-3"></span>
						<span>Invite participants automatically</span>
					</div>
					<div class="flex items-center">
						<span class="w-2 h-2 bg-[#353DAD] rounded-full mr-3"></span>
						<span>Track attendance and results</span>
					</div>
					<div class="flex items-center">
						<span class="w-2 h-2 bg-[#6B9AD9] rounded-full mr-3"></span>
						<span>Generate detailed reports</span>
					</div>
				</div>
			</div>

			<!-- Status panel -->
			<div class="border-[#8C8C8C] rounded-[10px] border-2 bg-white p-4">
				<div class="flex items-center mb-4">
					<h2 class="font-bold text-lg">CURRENT STATUS</h2>
				</div>
				<div class="text-center py-6">
					<div class="text-4xl mb-3">🚧</div>
					<h3 class="font-bold text-gray-700 mb-2">Under Development</h3>
					<p class="text-sm text-gray-500">
						The audition management system is currently being developed.
						New features will be available soon!
					</p>
				</div>
				<div class="mt-4 text-xs text-gray-400 text-center">
					Expected release: Coming soon
				</div>
			</div>
		</div>

		<!-- Section actions comme dans le dashboard -->
		<div class="mt-6 border-t border-gray-200 pt-6">
			<div class="grid {isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-4 gap-4'}">
				<button
					class="px-4 py-2 bg-[#6B9AD9] text-white rounded-[8px] hover:bg-blue-700 transition-colors font-medium"
					on:click={() => goto(`/projects/${data.id}/management/participants`)}
				>
					View Participants
				</button>
				<button
					class="px-4 py-2 bg-[#6B9AD9] text-white rounded-[8px] hover:bg-blue-700 transition-colors font-medium"
					on:click={() => goto(`/projects/${data.id}/management/validation`)}
				>
					Validate Applications
				</button>
				<button
					class="px-4 py-2 bg-gray-500 text-white rounded-[8px] cursor-not-allowed opacity-50 font-medium"
					disabled
				>
					Schedule Auditions
				</button>
				<button
					class="px-4 py-2 bg-gray-500 text-white rounded-[8px] cursor-not-allowed opacity-50 font-medium"
					disabled
				>
					Export Results
				</button>
			</div>
		</div>
	</div>

	<!-- Section additionnelle pour les notifications comme dans le dashboard -->
	<div class="mt-4 bg-white border-2 border-[#E35656] rounded-[10px] p-4">
		<h3 class="text-lg font-bold text-[#E35656] uppercase mb-3">Development Notice</h3>
		<div class="text-sm text-gray-600">
			<p class="mb-2">
				🎯 <strong>Audition Management</strong> is an upcoming feature that will allow you to:
			</p>
			<ul class="list-disc list-inside space-y-1 ml-4">
				<li>Create and schedule audition sessions</li>
				<li>Automatically invite selected participants</li>
				<li>Set evaluation criteria and scoring systems</li>
				<li>Track audition progress and results</li>
				<li>Generate comprehensive reports</li>
			</ul>
			<p class="mt-3 text-[#E35656] font-medium">
				This feature is currently under active development and will be available in future updates.
			</p>
		</div>
	</div>
</div>

{#if isMobile}
	<ProjectPhoneDisplayer {project} selectedTab={5} />
{/if}

<style>
    /* Animation pour les cards hover */
    .transform:hover {
        transform: scale(1.05);
    }

    /* Transition pour tous les éléments interactifs */
    .transition-all {
        transition: all 0.3s ease;
    }

    /* Effet de gradient personnalisé */
    .bg-gradient-to-br {
        background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
    }

    /* Amélioration de l'accessibilité pour les boutons */
    button:focus {
        outline: 2px solid #6B9AD9;
        outline-offset: 2px;
    }

    /* Animation subtile pour les icônes */
    .text-3xl {
        transition: transform 0.2s ease;
    }

    .cursor-pointer:hover .text-3xl {
        transform: scale(1.1);
    }
</style>