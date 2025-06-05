<script lang="ts">
	import type { Project } from '$lib/types/Project';
	import Dashboard from './Dashboard.svelte';
    import { goto } from '$app/navigation';
	import DateShow from '$lib/components/DateShow.svelte';

	export let project : any;

    export let selectedTab: number;

	let participantsUrl: string;
	let maillingUrl: string;
	let projectUrl: string;
    let callsheetUrl : string;
	let attendanceUrl : string;

	// Reactif : met à jour les URLs dès que project devient dispo
	$: if (project) {
		participantsUrl = `/projects/${project.id}/management/participants`;
		maillingUrl = `/projects/${project.id}/management/mailing`;
		projectUrl = `/projects/${project.id}/management`;
        callsheetUrl = `/projects/${project.id}/management/callsheets`;
		attendanceUrl = `/projects/${project.id}/management/attendance`;
	}
</script>

<div class="bg-white">
{#if project}
<div class="flex items-center p-2">
	<h1 class="text-4xl font-bold text-gray-500 ml-[1vw] mr-[1vw] mt-[3vh] mb-[3vh]">Project : {project.name}</h1>
	<div
		class="ml-4 inline-flex items-center px-3 py-1 mt-1 text-sm text-gray-400 border-[1.5px] rounded-lg"
	>

		<div class="">
			<p>
				Created at: <DateShow startTime={project.createdAt} />
			</p>
			<p>
				Updated at: <DateShow startTime={project.updatedAt} />
			</p>
		</div>
	</div>
	<a
		href="/projects/{project.id}/management/modify"
		class="ml-auto mr-4 h-[50%] inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#6B9AD9] rounded-lg hover:bg-blue-800"
	>
		Edit Project
	</a>
</div>
<!--Tabs-->
<div class="ml-5 w-full text-lg text-gray-400 font-semibold flex gap-[3vw]">
	<button class=" p-3 {selectedTab === 0 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}" on:click={() => goto(projectUrl)}>Project Details</button>
	<button class=" p-3 {selectedTab === 1 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}" on:click={() => goto(participantsUrl)}>Participants</button>
	<button class=" p-3 {selectedTab === 2 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}" on:click={() => goto(maillingUrl)}>Mailling</button>
	<button class=" p-3 {selectedTab === 3 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}" on:click={() => goto(callsheetUrl)}>Callsheet</button>
	<button class=" p-3 {selectedTab === 4 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}" on:click={() => goto(attendanceUrl)}>Attendances</button>
</div>
{:else}
<div class="flex items-center p-2">
	<h1 class="text-4xl font-bold text-gray-500 ml-[1vw] mr-[1vw] mt-[3vh] mb-[3vh]">Project : Loading...</h1>
	<div
		class="ml-4 inline-flex items-center px-3 py-1 mt-1 text-sm text-gray-400 border-[1.5px] rounded-lg"
	>

		<div class="">
			<p>
				Created at : -
			</p>
			<p>
				Updated at : -
			</p>
		</div>
	</div>
	<span
    class="ml-auto mr-4 h-[50%] inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-[#6B9AD9] rounded-lg"
  >
    Edit Project
  </span>
</div>
<div class="ml-5 w-full text-lg text-gray-400 font-semibold flex gap-[3vw]">
	<button class=" p-3 {selectedTab === 0 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}">Project Details</button>
	<button class=" p-3 {selectedTab === 1 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}">Participants</button>
	<button class=" p-3 {selectedTab === 2 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}">Mailling</button>
	<button class=" p-3 {selectedTab === 3 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}">Callsheet</button>
	<button class=" p-3 {selectedTab === 4 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}">Attendances</button>
</div>
{/if}
</div>