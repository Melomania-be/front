<script lang="ts">
	import type { Project } from '$lib/types/Project';
	import Dashboard from './Dashboard.svelte';
    import { goto } from '$app/navigation';
	import DateShow from '$lib/components/DateShow.svelte';
	import { onMount } from 'svelte';
	import Fa from 'svelte-fa';
	import { faCalendarCheck, faDiagramProject, faEnvelope, faMusic, faSheetPlastic, faUsers } from '@fortawesome/free-solid-svg-icons';

	export let project : any;
	
    export let selectedTab: number;


	let participantsUrl: string;
	let maillingUrl: string;
	let projectUrl: string;
    let callsheetUrl : string;
	let attendanceUrl : string;
	let auditionsUrl : string;
	
	let participantNotValidated : number = 0;

	// Reactif : met à jour les URLs dès que project devient dispo
	$: if (project) {
		participantsUrl = `/projects/${project.id}/management/participants`;
		maillingUrl = `/projects/${project.id}/management/mailing`;
		projectUrl = `/projects/${project.id}/management`;
        callsheetUrl = `/projects/${project.id}/management/callsheets`;
		attendanceUrl = `/projects/${project.id}/management/attendance`;
		auditionsUrl = `/projects/${project.id}/management/auditions`;

		if(project?.participants){
        for(const p of project.participants){
            if( !p.accepted ){
                participantNotValidated++;
            }
        }
    }
	}

	let isMobile = false;
	let screenDirection : "horizontal" | "vertical" = "vertical";

	const checkMobile = () => {
		isMobile = window.innerWidth <= 1000;
	};

	const checkDirection = () => {
        screenDirection = (window.innerWidth > window.innerHeight ? "horizontal" : "vertical");
	};

	onMount(() => {
		checkMobile();
		checkDirection();
		window.addEventListener('resize', checkMobile);
		window.addEventListener('resize', checkDirection);

		return () => {
			window.removeEventListener('resize', checkMobile);
			window.removeEventListener('resize', checkDirection);
		};
	});
</script>

<div class="bg-white">
{#if !isMobile}
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
		<button class="flex items-center gap-2 p-3 {selectedTab === 0 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}" on:click={() => goto(projectUrl)}>
			<Fa icon={faDiagramProject} class="text-[16px]" style="color: {selectedTab === 0 ? "#6B9AD9;" : " #9ca3af;" }"/>
			Project Details
		</button>
		<button class="flex gap-2 items-center p-3 {selectedTab === 1 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}" on:click={() => goto(participantsUrl)}>
			<div class="flex items-center gap-2 ">
			<Fa icon={faUsers} class="text-[16px]" style="color: {selectedTab === 1 ? "#6B9AD9;" : " #9ca3af;" }"/>
			Participants
				<div class="bg-red-400 text-white w-[19px] h-[19px] rounded-full text-[0.9rem] text-center flex justify-center -mt-3 -ml-1
				{participantNotValidated === 0 ? "invisible" : "visible"}">
					<span class="-mt-[4px]">{participantNotValidated}</span>
				</div>
			</div>
		</button>
		<button class="flex items-center gap-2 p-3 {selectedTab === 2 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}" on:click={() => goto(maillingUrl)}>
			<Fa icon={faEnvelope} class="text-[16px]" style="color: {selectedTab === 2 ? "#6B9AD9;" : " #9ca3af;" }"/>
			Mailling
		</button>
		<button class="flex gap-2 items-center p-3 {selectedTab === 3 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}" on:click={() => goto(callsheetUrl)}>
			<Fa icon={faSheetPlastic} class="text-[16px]" style="color: {selectedTab === 3 ? "#6B9AD9;" : " #9ca3af;" }"/>
			Callsheet
		</button>
		<button class="flex gap-2 items-center p-3 {selectedTab === 4 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}" on:click={() => goto(attendanceUrl)}>
			<Fa icon={faCalendarCheck} class="text-[16px]" style="{selectedTab === 4 ? "#6B9AD9;" : " #9ca3af;" }" />
			Attendances
		</button>
		<button class="flex gap-2 items-center p-3 {selectedTab === 5 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}" on:click={() => goto(auditionsUrl)}>
			<Fa icon={faMusic} class="text-[16px]" style="{selectedTab === 5 ? "#6B9AD9;" : " #9ca3af;" }" />
			Auditions
		</button>
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
		<button class="flex items-center gap-2 p-3 {selectedTab === 0 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}">
			<Fa icon={faDiagramProject} class="text-[16px]" style="color: {selectedTab === 0 ? "#6B9AD9;" : " #9ca3af;" }"/>
			Project Details
		</button>
		<button class="flex gap-2 items-center p-3 {selectedTab === 1 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}">
			<Fa icon={faUsers} class="text-[16px]" style="color: {selectedTab === 1 ? "#6B9AD9;" : " #9ca3af;" }"/>
			Participants
			<div class="bg-red-400 text-white w-[19px] h-[19px] rounded-full text-[0.9rem] text-center flex justify-center -mt-3 -ml-1
				{participantNotValidated === 0 ? "invisible" : "visible"}">
					<span class="-mt-[4px]">{participantNotValidated}</span>
				</div>
		</button>
		<button class="flex items-center gap-2 p-3 {selectedTab === 2 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}">
			<Fa icon={faEnvelope} class="text-[16px]" style="color: {selectedTab === 2 ? "#6B9AD9;" : " #9ca3af;" }"/>
			Mailling
		</button>
		<button class="flex gap-2 items-center p-3 {selectedTab === 3 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}">
			<Fa icon={faSheetPlastic} class="text-[16px]" style="color: {selectedTab === 3 ? "#6B9AD9;" : " #9ca3af;" }"/>
			Callsheet
		</button>
		<button class="flex gap-2 items-center p-3 {selectedTab === 4 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}">
			<Fa icon={faCalendarCheck} class="text-[16px]" style="{selectedTab === 4 ? "#6B9AD9;" : " #9ca3af;" }" />
			Attendances
		</button>
		<button class="flex gap-2 items-center p-3 {selectedTab === 5 ? "text-[#6B9AD9] border-b-[3px] border-[#6B9AD9]" : ""}">
			<Fa icon={faMusic} class="text-[16px]" style="{selectedTab === 5 ? "#6B9AD9;" : " #9ca3af;" }" />
			Auditions
		</button>
	</div>
	{/if}
{:else}
		<div class="flex {screenDirection === "horizontal" ? "flex-row" : "flex-col"} items-center p-2 w-screen mb-2">
			<h1 class="text-4xl font-bold text-gray-500 mr-4 mb-4">Project : { project ? project.name : "Loading..."}</h1>
			<div class="grid items-center m-1 {screenDirection === "horizontal" ? "ml-auto w-[50%]" : "w-full"} mr-2 grid-cols-[2fr_1fr] gap-2">
				<div
					class="inline-flex items-center px-3 py-1 mt-1 text-sm text-gray-400 border-2 rounded-lg max-w-[250px]"
				>
					<div class="">
						<p>
							Created at : {#if project}<DateShow startTime={project.createdAt} /> {:else} - {/if}
						</p>
						<p>
							Updated at : {#if project} <DateShow startTime={project.updatedAt} /> {:else} - {/if}
						</p>
					</div>
				</div>
				{#if project}
					<a
						href="/projects/{project.id}/management/modify"
						class="ml-auto mt-auto flex items-center h-[40px] px-3 py-2 text-sm font-medium text-center text-white bg-[#6B9AD9] rounded-lg hover:bg-blue-800"
					>
						<span>Edit Project</span>
					</a>
				{:else}
					<span
					class="ml-auto mt-auto flex items-center h-[40px] px-3 py-2 text-sm font-medium text-center text-white bg-[#6B9AD9] rounded-lg hover:bg-blue-800"
					>
					Edit Project
					</span>
				{/if}
			</div>
		</div>
{/if}
</div>