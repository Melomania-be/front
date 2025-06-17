<script lang="ts">
	import type { Project } from '$lib/types/Project';
	import Dashboard from './Dashboard.svelte';
    import { goto } from '$app/navigation';
	import DateShow from '$lib/components/DateShow.svelte';
	import { onMount } from 'svelte';
	import Fa from 'svelte-fa';
	import { faCalendarCheck, faDiagramProject, faEnvelope, faSheetPlastic, faUsers } from '@fortawesome/free-solid-svg-icons';

	export let project : any;
	
    export let selectedTab: number;

	let participantsUrl: string;
	let maillingUrl: string;
	let projectUrl: string;
    let callsheetUrl : string;
	let attendanceUrl : string;
	
	let participantNotValidated : number = 0;

	// Reactif : met à jour les URLs dès que project devient dispo
	$: if (project) {
		participantsUrl = `/projects/${project.id}/management/participants`;
		maillingUrl = `/projects/${project.id}/management/mailing`;
		projectUrl = `/projects/${project.id}/management`;
        callsheetUrl = `/projects/${project.id}/management/callsheets`;
		attendanceUrl = `/projects/${project.id}/management/attendance`;

		if(project?.participants){
        for(const p of project.participants){
            if( !p.accepted ){
                participantNotValidated++;
            }
        }
    }
	}

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

<div class="fixed top-auto bottom-0 left-0 right-0 h-[50px] bg-white shadow-[0_0_10px_10px_#E7E7E7] border-[#E7E7E7] flex justify-center items-center z-20 rounded-t-xl">
{#if isMobile}
	{#if project}
	<!--Tabs-->
	<div class="ml-5 w-full text-lg text-gray-400 font-semibold flex gap-[3vw]">
		<button class="flex-1 flex p-3 justify-center items-center" on:click={() => goto(projectUrl)}>
            <div class="{selectedTab === 0 ? " bg-[#6B9AD9]" : ""} p-2 rounded-full">
                <Fa icon={faDiagramProject} class="text-[16px]" style="color: {selectedTab === 0 ? "white;" : "#8C8C8C;" }"/>
            </div>
        </button>
		<button class="flex-1 flex p-3 justify-center items-center" on:click={() => goto(participantsUrl)}>
			<div class="{selectedTab === 1 ? " bg-[#6B9AD9] w-[33px] flex items-center justify-center" : ""} p-2 rounded-full">
            	<Fa icon={faUsers} class="text-[16px]" style="color: {selectedTab === 1 ? "white;" : "#8C8C8C;" }" />
			</div>
			{#if participantNotValidated}
				<div class="-mt-3 -ml-2 bg-red-400 text-white w-[15px] h-[15px] rounded-full text-[0.8rem] text-center flex justify-center">
					<span class="-mt-[6.8px]">{participantNotValidated}</span>
				</div>
			{/if}
		</button>
		<button class="flex-1 flex p-3 justify-center items-center" on:click={() => goto(maillingUrl)}>
			<div class="{selectedTab === 2 ? " bg-[#6B9AD9]" : ""} p-2 rounded-full">
            <Fa icon={faEnvelope} class="text-[16px]" style="color:  {selectedTab === 2 ? "white;" : "#8C8C8C;" }" />
			</div>
        </button>
		<button class="flex-1 flex p-3 justify-center items-center" on:click={() => goto(callsheetUrl)}>
			<div class="{selectedTab === 3 ? " bg-[#6B9AD9]" : ""} p-2 rounded-full">
            <Fa icon={faSheetPlastic} class="text-[16px]" style="color: {selectedTab === 3 ? "white;" : "#8C8C8C;" }" />
			</div>
        </button>
		<button class="flex-1 flex p-3 justify-center items-center" on:click={() => goto(attendanceUrl)}>
			<div class="{selectedTab === 4 ? " bg-[#6B9AD9]" : ""} p-2 rounded-full">
            <Fa icon={faCalendarCheck} class="text-[16px]" style="color: {selectedTab === 4 ? "white;" : "#8C8C8C;" }" />
			</div>
        </button>
	</div>
	{:else}
	<div class="ml-5 w-full text-lg text-gray-400 font-semibold flex gap-[3vw]">
		<button class="flex-1 flex p-3 justify-center items-center">
            <div class="{selectedTab === 0 ? " bg-[#6B9AD9]" : ""} p-2 rounded-full">
                <Fa icon={faDiagramProject} class="text-[16px]" style="color: {selectedTab === 0 ? "white;" : "#8C8C8C;" }"/>
            </div>
        </button>
		<button class="flex-1 flex p-3 justify-center items-center">
			<div class="{selectedTab === 1 ? " bg-[#6B9AD9] w-[33px] flex items-center justify-center" : ""} p-2 rounded-full">
            	<Fa icon={faUsers} class="text-[16px]" style="color: {selectedTab === 1 ? "white;" : "#8C8C8C;" }" />
			</div>
			{#if participantNotValidated}
				<div class="-mt-3 -ml-2 bg-red-400 text-white w-[15px] h-[15px] rounded-full text-[0.8rem] text-center flex justify-center">
					<span class="-mt-[6.8px]">{participantNotValidated}</span>
				</div>
			{/if}
		</button>
		<button class="flex-1 flex p-3 justify-center items-center">
			<div class="{selectedTab === 2 ? " bg-[#6B9AD9]" : ""} p-2 rounded-full">
            <Fa icon={faEnvelope} class="text-[16px]" style="color:  {selectedTab === 2 ? "white;" : "#8C8C8C;" }" />
			</div>
        </button>
		<button class="flex-1 flex p-3 justify-center items-center">
			<div class="{selectedTab === 3 ? " bg-[#6B9AD9]" : ""} p-2 rounded-full">
            <Fa icon={faSheetPlastic} class="text-[16px]" style="color: {selectedTab === 3 ? "white;" : "#8C8C8C;" }" />
			</div>
        </button>
		<button class="flex-1 flex p-3 justify-center items-center">
			<div class="{selectedTab === 4 ? " bg-[#6B9AD9]" : ""} p-2 rounded-full">
            <Fa icon={faCalendarCheck} class="text-[16px]" style="color: {selectedTab === 4 ? "white;" : "#8C8C8C;" }" />
			</div>
        </button>
	</div>
	{/if}
{:else}
	<div></div>
{/if}
</div>