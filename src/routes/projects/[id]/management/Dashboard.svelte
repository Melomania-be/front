<!-- src/routes/projects/[id]/management/Dashboard.svelte - Enhanced version with conditional alert -->
<script lang="ts">
	import DateShow from '$lib/components/DateShow.svelte';
	import type { Participant } from '$lib/types/Participant';
	import { onMount } from 'svelte';
	import DisplayerEvents from './DisplayerEvents.svelte';
	import DisplayerFolder from './DisplayerFolder.svelte';
	import DisplayerPieces from './DisplayerPieces.svelte';
	import DisplayerSection from './DisplayerSection.svelte';
	import DisplayerSheets from './DisplayerSheets.svelte';
	import Notification from './Notification.svelte';
	import MaterialStatusAlert from '$lib/components/materials/MaterialStatusAlert.svelte';
	import {faUser} from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';
	import { browser } from '$app/environment';

	export let project: any;
	export let participants: Participant[] = [];
	export let participantsNotSeenCallsheet: Array<any> = [];
	export let participantsNotValidated: Array<any> = [];
	export let participantsWithoutEmail: Array<any> = [];

	let isMobile = false;
	let windowWidth : number;
	let showMaterialAlert = true; // This will be dynamically set based on material status

	const checkMobile = () => {
		if (browser) {
			isMobile = window.innerWidth <= 1000;
			windowWidth = window.innerWidth;
		}
	};

	// Listen for material status changes to hide/show the alert
	onMount(() => {
		checkMobile();
		if (browser) {
			window.addEventListener('resize', checkMobile);

			// Listen for material selection changes
			const handleMaterialChange = () => {
				// The MaterialStatusAlert component will handle its own visibility
				// based on whether there are unspecified materials
			};

			window.addEventListener('materialSelectionChanged', handleMaterialChange);

			return () => {
				window.removeEventListener('resize', checkMobile);
				window.removeEventListener('materialSelectionChanged', handleMaterialChange);
			};
		}
	});
</script>

{#if project}
	<div class="h-auto p-4 {isMobile ? "bg-[#E7E7E7] w-screen" : "bg-[#E7E7E7]"} border-2">
		<!-- Material Status Alert - Only shows if there are pieces without materials -->
		{#if project.id}
			<MaterialStatusAlert projectId={project.id} />
{/if}

<!-- Statistics grid -->
<div class="grid {isMobile ? "grid-cols-1" : " grid-cols-2"} items-center w-full mb-4">
			<div class="bg-white border-2 border-[#E35656] rounded-[10px] {isMobile ? "w-full" : " w-[90%]"}">
				<Notification bind:participantsWithoutEmail bind:project bind:participantsNotValidated />
</div>

<div class="flex text-white h-[100px] font-bold {isMobile ? "w-full text-xs mt-4" : " ml-auto mr-4"}">
				<div class="flex w-full text-center {isMobile ? "gap-3" : "gap-6"}">
					<div class="rounded-lg py-2 px-4 flex-1 h-full bg-[#6CB1C8]">
	<p>PARTICIPANTS</p>
	<p class="font-extrabold {isMobile ? 'mt-6 mobile-stat-text' : '-mt-1 text-[45px]'}">{project?.participants?.length || 0}</p>
</div>
<div class="rounded-lg py-2 px-4 flex-1 bg-[#5077BA]">
	<p>REHEARSALS</p>
	<p class="font-extrabold {isMobile ? "mt-6 text-[45px]" : "-mt-1 text-[45px]"}">{project?.rehearsals?.length || 0}</p>
</div>
<div class="rounded-lg py-2 px-4 flex-1 bg-[#353DAD]">
	<p>CONCERTS</p>
	<p class="font-extrabold {isMobile ? "mt-6 text-[45px]" : "-mt-1 text-[45px]"}">{project?.concerts?.length || 0}</p>
</div>
</div>
</div>
</div>

<!-- Events display -->
<div class="flex w-[100%] flex-col md:flex-row gap-6 mt-4">
	<DisplayerEvents bind:project />
</div>

<!-- Managers section -->
<div class="h-full {isMobile ? "w-full" : "w-2/5"} mt-4 border-[#8C8C8C] rounded-[10px] border-2 bg-white dark:bg-gray-800 dark:border-gray-700">
			<div class="flex p-4 flex-col w-full">
	<div class="flex items-center">
		<h1 class="font-bold text-lg">PROJECT MANAGERS</h1>
		<div class="ml-auto mr-0">
			{#if project?.id}
				<a
					class="text-white font-bold text-sm bg-[#6B9AD9] p-2 rounded-[8px] hover:bg-[#5a9bb4] transition-colors"
					href="/projects/{project.id}/management/modify">Edit</a
				>
			{:else}
				<span class="text-gray-400 font-bold text-sm bg-gray-300 p-2 rounded-[8px] cursor-not-allowed">Edit</span>
			{/if}
		</div>
	</div>
	<div class="text-sm my-6 grid {isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2">
		{#if !project?.responsibles || project.responsibles.length === 0}
			<p class="text-center {isMobile ? 'col-span-1' : 'col-span-2'} text-gray-500">No project managers assigned</p>
		{:else}
			{#each project.responsibles as responsible}
				{#if responsible}
					<a href="/contacts/{responsible.id || '#'}" class="pl-4 border-[1.5px] border-[#B6B6B6] text-sm flex items-center gap-3 rounded-full p-1 hover:bg-blue-100 transition-colors">
						<Fa icon={faUser} class="text-[16px]" style="color: #6B9AD9;" />
						<div class="flex flex-col w-full">
							<p class="truncate overflow-hidden whitespace-nowrap {isMobile ? 'max-w-[120px]' : 'max-w-[80px]'}">{responsible.firstName || 'Unknown'}</p>
							<p class="truncate overflow-hidden whitespace-nowrap max-w-[90%]">{responsible.lastName || 'Name'}</p>
						</div>
					</a>
				{/if}
			{/each}
		{/if}
	</div>
</div>
</div>

<!-- Sections display -->
<div class="mt-4">
	<DisplayerSection bind:project bind:participants participantsNotValidated={participantsNotValidated} />
</div>

<!-- Sheets display -->
<div class="flex mt-4">
	<div class="w-full">
		<DisplayerSheets
			bind:project
			bind:participants
			bind:participantsSeenCallsheet={participantsNotSeenCallsheet}
			bind:participantsNotValidated
		/>
	</div>
</div>

<!-- Pieces display -->
<div class="mt-4 w-full {isMobile ? '' : 'md:w-1/2'}">
	<DisplayerPieces bind:project />
</div>
</div>
{:else}
<!-- Loading state -->
<div class="flex justify-center items-center h-64 bg-gray-100 rounded-lg">
	<div class="text-center">
		<div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
		<p class="text-gray-600">Loading project dashboard...</p>
	</div>
</div>
{/if}

<style>
    /* Mobile responsive adjustments */
    @media (max-width: 1000px) {
        :global(.grid-cols-2) {
            grid-template-columns: repeat(1, minmax(0, 1fr));
        }
    }

    @media (max-width: 768px) {
        :global(.md\:grid-cols-2) {
            grid-template-columns: repeat(1, minmax(0, 1fr));
        }

        /* Custom mobile font size for statistics */
        .mobile-stat-text {
            font-size: 2.5rem;
            line-height: 1;
        }

        :global(.gap-6) {
            gap: 0.75rem;
        }
    }
</style>