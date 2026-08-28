<script lang="ts">
	import { onMount } from 'svelte';
	import TaskBoard from '$lib/components/tasks/TaskBoard.svelte';
	import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte';
	import ProjectPhoneDisplayer from '../ProjectPhoneDisplayer.svelte';
	import type { Project } from '$lib/types/Project';

	// Grâce au fichier +page.ts, "data" fonctionne maintenant parfaitement !
	export let data;

	let project: Project | undefined;
	let isMobile = false;

	const checkMobile = () => {
		isMobile = window.innerWidth <= 1000;
	};

	onMount(async () => {
		checkMobile();
		window.addEventListener('resize', checkMobile);

		await fetchProject();

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	// Ta fonction de chargement identique à 100%
	async function fetchProject() {
		if (!data?.id) return;

		const response = await fetch(`/api/projects/${data.id}`, {
			method: 'GET'
		});

		if (!response.ok) {
			return;
		}

		project = await response.json();
	}
</script>

<svelte:head>
	<title>Tâches du projet - Melomania</title>
</svelte:head>

<ProjectHeadDisplayer {project} selectedTab={8} />

<div class="bg-[#E7E7E7] p-4 min-h-screen pb-[80px]">
	<TaskBoard projectId={data.id} />
</div>

{#if isMobile}
	<ProjectPhoneDisplayer {project} selectedTab={8} />
{/if}