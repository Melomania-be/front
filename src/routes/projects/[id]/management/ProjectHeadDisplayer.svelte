<script lang="ts">
	import type { Project } from '$lib/types/Project';
	import Dashboard from './Dashboard.svelte';
    import { goto } from '$app/navigation';

	export let project : Project | undefined;

    export let selectedTab: number;

	let participantsUrl: string;
	let maillingUrl: string;
	let projectUrl: string;
    let callsheetUrl : string;

	// Reactif : met à jour les URLs dès que project devient dispo
	$: if (project) {
		participantsUrl = `/projects/${project.id}/management/participants`;
		maillingUrl = `/projects/${project.id}/management/mailing`;
		projectUrl = `/projects/${project.id}/management`;
        callsheetUrl = `/projects/${project.id}/management/callsheets`;
	}
</script>

{#if project}
<h1 class="text-4xl font-bold text-gray-500 ml-[1vw] mr-[1vw] mt-[3vh] mb-[3vh]">Project : {project.name}</h1>
<!--Tabs-->
<div class="ml-5 w-full text-lg text-gray-400 font-semibold flex gap-[3vw]">
	<button class=" p-3 {selectedTab === 0 ? "text-blue-500 border-b-[3px] border-blue-500" : ""}" on:click={() => goto(projectUrl)}>Project Details</button>
	<button class=" p-3 {selectedTab === 1 ? "text-blue-500 border-b-[3px] border-blue-500" : ""}" on:click={() => goto(participantsUrl)}>Participants</button>
	<button class=" p-3 {selectedTab === 2 ? "text-blue-500 border-b-[3px] border-blue-500" : ""}" on:click={() => goto(maillingUrl)}>Emails</button>
	<button class=" p-3 {selectedTab === 3 ? "text-blue-500 border-b-[3px] border-blue-500" : ""}" on:click={() => goto(callsheetUrl)}>Callsheet</button>
</div>
{:else}
<h1 class="text-4xl font-bold text-gray-500 ml-[1vw] mr-[1vw] mt-[3vh] mb-[3vh]">Project : Loading...</h1>
<div class="ml-5 w-full text-lg text-gray-400 font-semibold flex gap-[3vw]">
	<button class=" p-3 {selectedTab === 0 ? "text-blue-500 border-b-[3px] border-blue-500" : ""}">Project Details</button>
	<button class=" p-3 {selectedTab === 1 ? "text-blue-500 border-b-[3px] border-blue-500" : ""}">Participants</button>
	<button class=" p-3 {selectedTab === 2 ? "text-blue-500 border-b-[3px] border-blue-500" : ""}">Emails</button>
	<button class=" p-3 {selectedTab === 3 ? "text-blue-500 border-b-[3px] border-blue-500" : ""}">Callsheet</button>
</div>
{/if}