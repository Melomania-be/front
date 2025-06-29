<script lang="ts">
	import type { Participant } from '$lib/types/Participant';
	import type { Project } from '$lib/types/Project';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let participantsWithoutEmail: Array<Participant> = [];
	export let participantsNotValidated: Array<Participant> = [];
	export let project: Project;

	let managerDetails = false;
	let rehearsalDetails = false;
	let concertDetails = false;
	let sectionGroupDetails = false;
	let callsheetDetails = false;
	let registrationDetails = false;

	// Variables réactives sécurisées
	$: informationDisplayed = project ? (
		(!project.responsibles || project.responsibles.length === 0)
		|| (project.rehearsals?.length || 0) === 0
		|| (project.concerts?.length || 0) === 0
		|| (project.sectionGroup?.sections?.length || 0) === 0
		|| (!project.callsheets || project.callsheets?.length === 0 )
		|| !project.registration
	) : false;

	let isMobile = false;
	let windowWidth : number;

	const checkMobile = () => {
		if (browser) {
			isMobile = window.innerWidth <= 1000;
			windowWidth = window.innerWidth;
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

	let showPhonePopUpManager = false;
	let showPhonePopUpRehearsal = false;
	let showPhonePopUpConcert = false;
	let showPhonePopUpCallsheet = false;
	let showPhonePopUpSection = false;
	let showPhonePopUpRegistration = false;
</script>

{#if showPhonePopUpManager}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div class="bg-white p-6 rounded-xl shadow-xl w-[80%] text-center flex flex-col items-center justify-center">
			<h2 class="text-lg font-bold mb-2">NO MANAGER</h2>
			<div class="text-gray-500 flex flex-col py-4">
				Please add at least one person to be in charge of the project. This person will have its
				contact informations displayed for this project.
			</div>
			<div class="flex gap-6 w-full">
				<button
					class="mt-4 px-2 py-2 bg-[#6b9ad9] text-white rounded flex-1 font-semibold"
					on:click={() => {
						showPhonePopUpManager = false;
					}}>Close</button
				>
				{#if project?.id}
					<a
						href="/projects/{project.id}/management/modify"
						class="mt-4 px-2 py-2 bg-[#6b9ad9] text-white rounded flex-1 font-semibold"
						on:click={() => {
						showPhonePopUpManager = false;
					}}>Add Manager</a
					>
				{:else}
					<span class="mt-4 px-2 py-2 bg-gray-400 text-white rounded flex-1 font-semibold cursor-not-allowed">Add Manager</span>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if showPhonePopUpRehearsal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div class="bg-white p-6 rounded-xl shadow-xl w-[80%] text-center flex flex-col items-center justify-center">
			<h2 class="text-lg font-bold mb-2">NO REHEARSAL</h2>
			<div class="text-gray-500 flex flex-col py-4">
				Please add at least one rehearsal to the project. This will allow participants to know
				when they have to be present.
			</div>
			<div class="flex gap-6 w-full">
				<button
					class="mt-4 px-2 py-2 bg-[#6b9ad9] text-white rounded flex-1 font-semibold"
					on:click={() => {
						showPhonePopUpRehearsal = false;
					}}>Close</button
				>
				{#if project?.id}
					<a
						href="/projects/{project.id}/management/modify"
						class="mt-4 px-2 py-2 bg-[#6b9ad9] text-white rounded flex-1 font-semibold"
						on:click={() => {
						showPhonePopUpRehearsal = false;
					}}>Add Rehearsal</a
					>
				{:else}
					<span class="mt-4 px-2 py-2 bg-gray-400 text-white rounded flex-1 font-semibold cursor-not-allowed">Add Rehearsal</span>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if showPhonePopUpConcert}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div class="bg-white p-6 rounded-xl shadow-xl w-[80%] text-center flex flex-col items-center justify-center">
			<h2 class="text-lg font-bold mb-2">NO CONCERT</h2>
			<div class="text-gray-500 flex flex-col py-4">
				Please add at least one concert to the project. This will allow participants to know when
				they have to be present.
			</div>
			<div class="flex gap-6 w-full">
				<button
					class="mt-4 px-2 py-2 bg-[#6b9ad9] text-white rounded flex-1 font-semibold"
					on:click={() => {
						showPhonePopUpConcert = false;
					}}>Close</button
				>
				{#if project?.id}
					<a
						href="/projects/{project.id}/management/modify"
						class="mt-4 px-2 py-2 bg-[#6b9ad9] text-white rounded flex-1 font-semibold"
						on:click={() => {
						showPhonePopUpConcert = false;
					}}>Add Concert</a
					>
				{:else}
					<span class="mt-4 px-2 py-2 bg-gray-400 text-white rounded flex-1 font-semibold cursor-not-allowed">Add Concert</span>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if showPhonePopUpCallsheet}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div class="bg-white p-6 rounded-xl shadow-xl w-[80%] text-center flex flex-col items-center justify-center">
			<h2 class="text-lg font-bold mb-2">NO CALLSHEET</h2>
			<div class="text-gray-500 flex flex-col py-4">
				Please add at least one callsheet to the project. This will allow participants to have
				informations about this project when needed.
			</div>
			<div class="flex gap-6 w-full">
				<button
					class="mt-4 px-2 py-2 bg-[#6b9ad9] text-white rounded flex-1 font-semibold"
					on:click={() => {
						showPhonePopUpCallsheet = false;
					}}>Close</button
				>
				{#if project?.id}
					<a
						href="/projects/{project.id}/management/callsheets/creation"
						class="mt-4 px-2 py-2 bg-[#6b9ad9] text-white rounded flex-1 font-semibold"
						on:click={() => {
						showPhonePopUpCallsheet = false;
					}}>Add Callsheet</a
					>
				{:else}
					<span class="mt-4 px-2 py-2 bg-gray-400 text-white rounded flex-1 font-semibold cursor-not-allowed">Add Callsheet</span>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if showPhonePopUpSection}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div class="bg-white p-6 rounded-xl shadow-xl w-[80%] text-center flex flex-col items-center justify-center">
			<h2 class="text-lg font-bold mb-2">NO SECTION</h2>
			<div class="text-gray-500 flex flex-col py-4">
				Please add at least one section to the section group. This will allow participants to know
				in which section they are.
			</div>
			<div class="flex gap-6 w-full">
				<button
					class="mt-4 px-2 py-2 bg-[#6b9ad9] text-white rounded flex-1 font-semibold"
					on:click={() => {
						showPhonePopUpSection = false;
					}}>Close</button
				>
				<a
					href="/sectionGroups"
					class="mt-4 px-2 py-2 bg-[#6b9ad9] text-white rounded flex-1 font-semibold"
					on:click={() => {
						showPhonePopUpSection = false;
					}}>Add Section</a
				>
			</div>
		</div>
	</div>
{/if}

{#if showPhonePopUpRegistration}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div class="bg-white p-6 rounded-xl shadow-xl w-[80%] text-center flex flex-col items-center justify-center">
			<h2 class="text-lg font-bold mb-2">NO REGISTRATION</h2>
			<div class="text-gray-500 flex flex-col py-4">
				Please add a registration to the project. With this you will allow people to register to
				this project if they have the link.
			</div>
			<div class="flex gap-6 w-full">
				<button
					class="mt-4 px-2 py-2 bg-[#6b9ad9] text-white rounded flex-1 font-semibold"
					on:click={() => {
						showPhonePopUpRegistration = false;
					}}>Close</button
				>
				{#if project?.id}
					<a
						href="/projects/{project.id}/management/registration"
						class="mt-4 px-2 py-2 bg-[#6b9ad9] text-white rounded flex-1 font-semibold text-sm"
						on:click={() => {
						showPhonePopUpRegistration = false;
					}}>Add Registration</a
					>
				{:else}
					<span class="mt-4 px-2 py-2 bg-gray-400 text-white rounded flex-1 font-semibold text-sm cursor-not-allowed">Add Registration</span>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if project}
	<div class="p-2 pl-4 pr-4 w-full">
		<h3 class="text-lg font-bold text-[#E35656] uppercase">Information</h3>
		<div
			class="p-3 pl-8 w-full flex flex-wrap gap-2 justify-center"
		>
			{#if informationDisplayed}
				{#if !project.responsibles || project.responsibles.length === 0}
					{#if !isMobile}
						<a class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
							 href="/projects/{project.id}/management/modify"
							 on:mouseenter={() => managerDetails = true}
							 on:mouseleave={() => managerDetails = false}
						>
							<span>No Manager</span>

							<div class="tooltip font-s pointer-events-none {managerDetails ? 'visible' : ''}">
								Please add at least one person to be in charge of the project. This person will have its
								contact informations displayed for this project.
							</div>

						</a>
					{:else}
						<button class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
										on:click={()=>showPhonePopUpManager = true}
						><span>No Manager</span></button>
					{/if}
				{/if}
				{#if (project.rehearsals?.length || 0) === 0}
					{#if !isMobile}
						<a class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
							 href="/projects/{project.id}/management/modify"
							 on:mouseenter={() => rehearsalDetails = true}
							 on:mouseleave={() => rehearsalDetails = false}
						>
							<span>No Rehearsal</span>
							<div class="tooltip font-s pointer-events-none {rehearsalDetails ? 'visible' : ''}">
								Please add at least one rehearsal to the project. This will allow participants to know
								when they have to be present.
							</div>
						</a>
					{:else}
						<button class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
										on:click={()=>showPhonePopUpRehearsal = true}
						><span>No Rehearsal</span></button>
					{/if}
				{/if}
				{#if (project.concerts?.length || 0) === 0}
					{#if !isMobile}
						<a class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
							 href="/projects/{project.id}/management/modify"
							 on:mouseenter={() => concertDetails = true}
							 on:mouseleave={() => concertDetails = false}
						>
							<span>No Concert</span>
							<div class="tooltip font-s pointer-events-none {concertDetails ? 'visible' : ''}">
								Please add at least one concert to the project. This will allow participants to know when
								they have to be present.
							</div>
						</a>
					{:else}
						<button class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
										on:click={()=>showPhonePopUpConcert = true}
						><span>No Concert</span></button>
					{/if}
				{/if}
				{#if (project.sectionGroup?.sections?.length || 0) === 0}
					{#if !isMobile}
						<a class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
							 href="/sectionGroups"
							 on:mouseenter={() => sectionGroupDetails = true}
							 on:mouseleave={() => sectionGroupDetails = false}
						>
							<span>No Section</span>
							<div class="tooltip font-s pointer-events-none {sectionGroupDetails ? 'visible' : ''}">
								Please add at least one section to the section group. This will allow participants to know
								in which section they are.
							</div>
						</a>
					{:else}
						<button class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
										on:click={()=>showPhonePopUpSection = true}
						><span>No Section</span></button>
					{/if}
				{/if}
				{#if !project.callsheets || (project.callsheets?.length || 0) === 0}
					{#if !isMobile}
						<a class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
							 href="/projects/{project.id}/management/callsheets"
							 on:mouseenter={() => callsheetDetails = true}
							 on:mouseleave={() => callsheetDetails = false}
						>
							<span>No Callsheet</span>
							<div class="tooltip font-s pointer-events-none {callsheetDetails ? 'visible' : ''}">
								Please add at least one callsheet to the project. This will allow participants to have
								informations about this project when needed.
							</div>
						</a>
					{:else}
						<button class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
										on:click={()=>showPhonePopUpCallsheet = true}
						><span>No Callsheet</span></button>
					{/if}
				{/if}
				{#if !project.registration}
					{#if !isMobile}
						<a class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
							 href="/projects/{project.id}/management/registration"
							 on:mouseenter={() => registrationDetails = true}
							 on:mouseleave={() => registrationDetails = false}
						>
							<span>No Registration</span>
							<div class="tooltip font-s pointer-events-none {registrationDetails ? 'visible' : ''}">
								Please add a registration to the project. With this you will allow people to register to
								this project if they have the link.
							</div>
						</a>
					{:else}
						<button class="tooltip-wrapper text-white font-semibold m-1 p-2 pl-4 pr-4 bg-[#E35656] rounded-[7px] h-full"
										on:click={()=>showPhonePopUpRegistration = true}
						><span>No Registration</span></button>
					{/if}
				{/if}
			{:else}
				<p class="mb-4 text-gray-500 uppercase">No information</p>
			{/if}
		</div>
	</div>
{:else}
	<div class="p-2 pl-4 pr-4 w-full flex justify-center items-center h-32">
		<div class="text-center">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
			<p class="text-gray-600">Loading notifications...</p>
		</div>
	</div>
{/if}

<style>
    .tooltip-wrapper {
        position: relative;
        display: inline-block;
        cursor: pointer;
        overflow: visible;
    }

    .tooltip {
        position: absolute;
        top: 100%; /* au-dessus de l'élément */
        margin-top: 0.5rem;
        left: 50%;
        transform: translateX(-50%);
        width: 30vw;
        background-color: #ffffff;
        color: #595959;
        font-weight: 400;
        padding: 0.4rem 0.6rem;
        border-radius: 5px;
        border: 2px solid #595959;
        font-size: 0.8rem;
        white-space: normal;
        word-wrap: break-word;
        z-index: 500;
        opacity: 0;
        transition: opacity 0.2s;
    }
    .tooltip::before {
        content: '';
        position: absolute;
        top: -14px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 7px;
        border-style: solid;
        border-color: transparent transparent #595959 transparent;
    }

    .tooltip.visible {
        opacity: 1;
    }
</style>