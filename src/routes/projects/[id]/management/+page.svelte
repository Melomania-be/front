<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import ProjectModifier from '$lib/components/project/ProjectModifier.svelte';
	import type { Participant } from '$lib/types/Participant';
	import type { Project } from '$lib/types/Project';
	import type { TableData } from '$lib/types/TableData';
	import { onMount } from 'svelte';
	import Dashboard from './Dashboard.svelte';
	import ProjectHeadDisplayer from './ProjectHeadDisplayer.svelte';
	import ProjectPhoneDisplayer from './ProjectPhoneDisplayer.svelte';
	import { writable } from 'svelte/store';

	export let data;

	// ✅ CORRECTION : Accès correct aux données selon les logs du backend
	let project = data?.data || null; // Pas de [0] car ce n'est pas un tableau
	let participantsNotSeenCallsheet = data?.participantsNotSeenCallsheet || [];
	let participantsNotValidated = data?.participantsNotValidated || [];
	let participantsWithoutEmail = data?.participantsWithoutEmail || [];

	// ✅ AJOUT : Debug pour voir la structure des données
	console.log('Frontend data structure:', {
		hasData: !!data,
		hasDataData: !!data?.data,
		projectId: project?.id,
		projectName: project?.name,
		participantsNotValidatedCount: participantsNotValidated.length,
		participantsWithoutEmailCount: participantsWithoutEmail.length,
		participantsNotSeenCallsheetCount: participantsNotSeenCallsheet.length
	});

	let allParticipants: Participant[] = [];

	// Vérifications conditionnelles
	let urlSvelteApi = project ? `/api/projects/${project.id}/management/participants` : '';
	let urlFront = project ? `/projects/${project.id}/management/participants` : '';
	let uniqueUrl = project ? `/projects/${project.id}/management/participants` : '';

	let options: any = {
		filter: '',
		limit: 250,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};

	onMount(async () => {
		if (project) {
			console.log('Project loaded, fetching participants...', project.id);
			await fetchData();
		} else {
			console.error('No project data available');
		}
	});

	async function fetchData() {
		if (!project || !project.id) {
			console.error('Cannot fetch data: no project or project ID');
			return;
		}

		try {
			let optionInUrls = `?page=${options.page}&limit=${options.limit}`;
			optionInUrls += '&filter=' + options.filter;
			optionInUrls += '&orderBy=' + options.orderBy;
			optionInUrls += '&order=' + options.order;

			const response = await fetch(`${urlSvelteApi}${optionInUrls}`, {
				method: 'GET'
			});

			if (response.ok) {
				const responseData = await response.json();
				allParticipants = responseData?.data || [];
				console.log('Participants loaded:', allParticipants.length);
			} else {
				console.error('Failed to fetch participants:', response.status);
			}
		} catch (error) {
			console.error('Error fetching participants:', error);
			allParticipants = [];
		}
	}

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

	// Réactivité pour mettre à jour les URLs quand project change
	$: if (project?.id) {
		urlSvelteApi = `/api/projects/${project.id}/management/participants`;
		urlFront = `/projects/${project.id}/management/participants`;
		uniqueUrl = `/projects/${project.id}/management/participants`;
	}
</script>

{#if project}
	<div class="w-auto {isMobile ? 'pb-[50px]' : ''}">
		<ProjectHeadDisplayer {project} selectedTab={0}></ProjectHeadDisplayer>
		<Dashboard
			{project}
			participants={allParticipants}
			{participantsNotSeenCallsheet}
			{participantsNotValidated}
			{participantsWithoutEmail}
		/>
		{#if isMobile}
			<ProjectPhoneDisplayer {project} selectedTab={0} />
		{/if}
	</div>
{:else}
	<div class="flex justify-center items-center h-64 bg-gray-100">
		<div class="text-center">
			<div
				class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"
			></div>
			<p class="text-gray-600 text-lg">Loading project...</p>
			<!-- ✅ AJOUT : Debug info -->
			<p class="text-gray-400 text-sm mt-2">
				Data available: {!!data}, Project: {!!project}
			</p>
		</div>
	</div>
{/if}
