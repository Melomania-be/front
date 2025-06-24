<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import ProjectModifier from '$lib/components/project/ProjectModifier.svelte';
	import type { Participant } from '$lib/types/Participant';
	import type { Project } from '$lib/types/Project';
	import type { TableData } from '$lib/types/TableData';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte';
	import ProjectPhoneDisplayer from '../ProjectPhoneDisplayer.svelte';
    
    export let data;

    let project : Project | undefined;
    
    async function fetchProject(){
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
		fetchProject();
	});

    let isMobile = false;

	const checkMobile = () => {
		isMobile = window.innerWidth <= 1000;
	};

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});
</script>

<ProjectHeadDisplayer {project} selectedTab={5} />
<div class="flex flex-col bg-[#E7E7E7] p-4 gap-4 min-h-screen font-bold text-center pt-[20%] text-3xl text-gray-500"> IN COMING ... </div>


{#if isMobile}
	<ProjectPhoneDisplayer project={project} selectedTab={5}/>
{/if}