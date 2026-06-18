<script lang="ts">
	import type { Project } from '$lib/types/Project';
	import type { Participant } from '$lib/types/Participant';
	import type { Callsheet } from '$lib/types/Callsheet';
	import Fa from 'svelte-fa';
	import { faWarning } from '@fortawesome/free-solid-svg-icons';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let project: Project;
	export let participants: Participant[] = [];
	export let participantsSeenCallsheet: Array<Participant> = [];
	export let participantsNotValidated: Array<Participant> = [];

	let mode: 'callsheets' | 'registration' = 'callsheets';

	function maxUpdateDate(callsheets: Callsheet[]) {
		if (!callsheets || callsheets.length === 0) return null;

		let maxDate = new Date(0);
		let index = 0;
		for (let i = 0; i < callsheets.length; i++) {
			if (callsheets[i]?.updatedAt && new Date(callsheets[i].updatedAt) > maxDate) {
				maxDate = new Date(callsheets[i].updatedAt);
				index = i;
			}
		}
		return callsheets[index];
	}

	let popUpStats = false;

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

	// Variables réactives sécurisées
	$: safeParticipants = participants || [];
	$: safeParticipantsSeenCallsheet = participantsSeenCallsheet || [];
	$: safeCallsheets = project?.callsheets || [];
	$: safeProjectParticipants = project?.participants || [];
	$: maxCallsheet = maxUpdateDate(safeCallsheets);
</script>

{#if popUpStats}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div class="bg-white p-6 rounded-xl shadow-xl  h-auto max-h-[80%] text-center {isMobile ? "w-[90%]" : "w-2/3"}">
		<h2 class="text-lg font-semibold mb-4">Statistics</h2>
		<div class="mt-2">
			<!-- Scrollable list with height -->
			<div class="grid  gap-2 max-h-[40vh] overflow-y-auto p-2 {isMobile ? "grid-cols-1" : "grid-cols-3"}">
				{#each safeParticipants as participant}
					{#if participant}
					<div class="text-sm border border-gray-400 rounded-full py-1 px-2 {safeParticipantsSeenCallsheet.find((p)=>p?.id === participant?.id) ? 'bg-red-200' : 'bg-green-200'}">
			{#if project?.id && participant?.id}
				<a href="/projects/{project.id}/management/participants/{participant.id}">
					{participant?.contact?.firstName || 'Unknown'} {participant?.contact?.lastName || 'Name'} (Participant profile)
				</a>
			{/if}
			{#if participant?.contact?.id}
				<a href="/contacts/{participant.contact.id}">(Profile)</a>
			{/if}
		</div>
{/if}
{/each}
</div>
</div>
<button
	class="mt-4 w-[30%] px-4 py-2 bg-[#6b9ad9] text-white rounded"
	on:click={() => {
				popUpStats = false;
			}}
>
	OK
</button>
</div>
</div>
{/if}

{#if project}
	<div class="w-full">
		<div class="flex gap-6 w-full {isMobile ? "flex-col" : "flex-row"}">
			<div class="border-[#8C8C8C] rounded-[10px] border-2 p-4 bg-white w-full">
		<div class="flex mb-4">
			<h1 class="font-bold text-lg">CALLSHEET</h1>

			<div class="ml-auto mr-0">
				{#if safeCallsheets.length > 0 && maxCallsheet}
					<a
						href="/projects/{project.id}/management/callsheets/{maxCallsheet.id}/creation"
						class="text-white font-bold bg-[#6B9AD9] hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
					>New Callsheet</a
					>
				{:else if project?.id}
					<a
						href="/projects/{project.id}/management/callsheets/creation"
						class="text-white font-bold text-sm hover:bg-blue-700 bg-[#6B9AD9] p-2 rounded-[8px]"
					>New callsheet</a
					>
				{:else}
					<span class="text-gray-400 font-bold text-sm bg-gray-300 p-2 rounded-[8px] cursor-not-allowed">New callsheet</span>
				{/if}
			</div>
		</div>
		<ul class="my-10 gap-2 grid  {isMobile ? "grid-cols-1" : "grid-cols-2"}">
						{#if safeCallsheets.length > 0}
							{#each safeCallsheets.reverse() as callsheet}
								{#if callsheet && project?.id}
								<li class="border-2 p-2 rounded-full border-gray-300 flex justify-center {maxCallsheet?.id === callsheet.id ? "bg-blue-100" : ""}">
									<div class="flex items-center justify-between">
		<div class="flex items-center space-x-1">
			<a href="/projects/{project.id}/management/callsheets/{callsheet.id}">
				<h3 class="text-sm font-medium text-gray-900 dark:text-white">
					Version : {callsheet.version || 'Unknown'} <span class="text-gray-400 mx-2">|</span>
					Last Update : {callsheet.updatedAt ? new Date(callsheet.updatedAt).toLocaleDateString('en-US', {year: 'numeric',month: 'long',day: 'numeric'}) : 'unknown'}
				</h3>
			</a>
		</div>
	</div>
		</li>
{/if}
{/each}
{:else}
<li class="text-sm px-10 text-center text-gray-500 col-span-2">No callsheet</li>
{/if}
</ul>
{#if safeProjectParticipants.length > 0}
	<div class="flex mt-1">
		<div class="w-full bg-gray-200 rounded-full dark:bg-gray-700">
			<div
				class="h-1 bg-[#6B9AD9] text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
				style="width: {safeProjectParticipants.length > 0 ? ((safeParticipants.length - safeParticipantsSeenCallsheet.length) / safeProjectParticipants.length) * 100 : 0}%;"
			></div>
		</div>
	</div>
	<div>
		{safeParticipants.length - safeParticipantsSeenCallsheet.length} / {safeProjectParticipants.length} participants have seen the last callsheet
	</div>
	<button
		on:click={()=>(popUpStats = true)}
		class="text-white bg-[#6B9AD9] mt-6 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
		Statistics
	</button>
{/if}
</div>

<div class="border-[#8C8C8C] rounded-[10px] border-2 p-4 bg-white w-full">
	<div class="flex items-center">
		<h1 class="font-bold text-lg">REGISTRATION</h1>
		{#if project?.id}
			{#if project.registration}
				<a class="ml-auto text-white font-bold text-sm hover:bg-blue-700 bg-[#6B9AD9] border-red-400 p-2 rounded-[8px]" href="/projects/{project.id}/management/registration"
				>Edit registration form</a
				>
			{:else}
				<a class="ml-auto text-white font-bold text-sm hover:bg-blue-700 bg-[#6B9AD9] p-2 rounded-[8px]" href="/projects/{project.id}/management/registration"
				>Add registration form</a
				>
			{/if}
		{:else}
			<span class="ml-auto text-gray-400 font-bold text-sm bg-gray-300 p-2 rounded-[8px] cursor-not-allowed">Registration</span>
		{/if}
	</div>

	{#if !project?.registration}
		<div class="my-6 flex justify-center items-center gap-2">
			<Fa icon={faWarning} class="text-[14px]" style="color: #f87171;" />
			<p class="text-red-400">No Registration Form</p>
			<Fa icon={faWarning} class="text-[14px]" style="color: #f87171;" />
		</div>
	{:else}
		<div class="text-gray-500 my-6 mt-4 ml-6">
			<p><strong>Last Update :</strong> {project.registration.updatedAt ? (new Date(project.registration.updatedAt).toLocaleDateString('en-US', {year: 'numeric',month: 'long',day: 'numeric'})) : "unknown" }</p>
			<p><strong>Created At :</strong> {project.registration.createdAt ? (new Date(project.registration.createdAt).toLocaleDateString('en-US', {year: 'numeric',month: 'long',day: 'numeric'})) : "unknown" }</p>
		</div>
	{/if}
</div>
</div>
</div>
{:else}
<div class="w-full h-64 flex justify-center items-center bg-gray-100 rounded-lg">
	<div class="text-center">
		<div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
		<p class="text-gray-600">Loading callsheets and registration...</p>
	</div>
</div>
{/if}