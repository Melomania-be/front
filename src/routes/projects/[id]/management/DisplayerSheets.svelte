<script lang="ts">
	import type { Project } from '$lib/types/Project';
	import type { Participant } from '$lib/types/Participant';
	import type { Callsheet } from '$lib/types/Callsheet';
	import Fa from 'svelte-fa';
	import { faWarning } from '@fortawesome/free-solid-svg-icons';

	export let project: Project;
	export let participants: Participant[]
	export let participantsSeenCallsheet: Array<Participant>;
	export let participantsNotValidated: Array<Participant>;

	console.log("PARTIC SEE : " , participants)

	let mode: 'callsheets' | 'registration' = 'callsheets';

	function maxUpdateDate(callsheets: Callsheet[]) {
		let maxDate = new Date(0);
		let index = 0;
		for (let i = 0; i < callsheets.length; i++) {
			if (new Date(callsheets[i].updatedAt) > maxDate) {
				maxDate = new Date(callsheets[i].updatedAt);
				index = i;
			}
		}
		return callsheets[index];
	}

	let popUpStats = false;
</script>

{#if popUpStats}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
	<div class="bg-white p-6 rounded-xl shadow-xl w-2/3 h-auto max-h-[80%] text-center">
		<h2 class="text-lg font-semibold mb-4">Statistics</h2>
		<div class="mt-2">
			<h3>Participants who have not seen the last callsheet :</h3>
			<!-- Scrollable list with height -->
			<div class="grid grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto p-2">
				{#each participants as participant}
					<div class="text-sm border border-gray-400 rounded-full py-1 px-2 {participantsSeenCallsheet.find((p)=>p.id === participant.id) ? 'bg-red-200' : 'bg-green-200'}">
						<a href="/projects/{project.id}/management/participants/{participant.id}">
							{participant.contact.firstName} {participant.contact.lastName} (Participant profile)
						</a>
						<a href="/contacts/{participant.contact.id}">(Profile)</a>
					</div>
				{/each}
			</div>
		</div>
		<button
			class="mt-4 w-[30%] ml-6 px-4 py-2 bg-[#6b9ad9] text-white rounded"
			on:click={() => {
				popUpStats = false;
			}}
		>
			OK
		</button>
	</div>
</div>
{/if}


<div class="w-full">
	<div class="flex gap-6 w-full">
			<div class="border-[#8C8C8C] rounded-[10px] border-2 p-4 bg-white rounded-lg w-full">
				<div class="flex mb-4">
					<h1 class="font-bold text-lg">CALLSHEET</h1>
				
				<div class="ml-auto mr-0">
					{#if project.callsheets && project.callsheets.length > 0}
						<a
							href="/projects/{project.id}/management/callsheets/{maxUpdateDate(project.callsheets)
								.id}/creation"
							class="text-white bg-[#6B9AD9] hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
							>Create a new callsheet from the last one</a
						>
					{:else}
						<a
							href="/projects/{project.id}/management/callsheets/creation"
							class="text-white font-bold text-sm hover:bg-blue-700 bg-[#6B9AD9] p-2 rounded-[8px]"
							>New callsheet</a
						>
					{/if}
				</div>
				</div>
				<ul class="my-10 gap-2 grid grid-cols-2">
						{#if project.callsheets}
							{#each project.callsheets.reverse() as callsheets}
								<li class="border-2 p-2 rounded-full border-gray-300 flex justify-center {maxUpdateDate(project.callsheets).id === callsheets.id ? "bg-blue-100" : ""}">
									<div class="flex items-center justify-between">
										<div class="flex items-center space-x-1">
											<a href="/projects/{project.id}/management/callsheets/{callsheets.id}">
												<h3 class="text-sm font-medium text-gray-900 dark:text-white">
													Version : {callsheets.version} <span class="text-gray-400 mx-2">|</span>
													Last Update : {new Date(callsheets.updatedAt).toLocaleDateString('en-US', {year: 'numeric',month: 'long',day: 'numeric'}) ?? 'unknown'}
												</h3>
											</a>
										</div>
									</div>
								</li>
							{/each}
						{:else}
							<li class="text-sm">No callsheet</li>
						{/if}
					</ul>
				{#if project.participants && project.participants.length > 0}
					<div class="flex mt-1">
						<div class="w-full bg-gray-200 rounded-full dark:bg-gray-700">
							<div
								class="h-1 bg-[#6B9AD9] text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
								style="width: {((participants.length - participantsSeenCallsheet.length) /
									project.participants.length) *
									100}%;"
							></div>
						</div>
					</div>
					<div>
						{participants.length - participantsSeenCallsheet.length} / {project.participants
							.length} participants have seen the last callsheet
					</div>
					<button
						on:click={()=>(popUpStats = true)}
						class="text-white bg-[#6B9AD9] mt-6 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
						Statistics
					</button>
				{/if}
			</div>

			<div class="border-[#8C8C8C] rounded-[10px] border-2 p-4 bg-white rounded-lg w-full">
				<div class="flex items-center">
						<h1 class="font-bold text-lg">REGISTRATION</h1>
						{#if project.registration}
						<a class="ml-auto text-white font-bold text-sm hover:bg-blue-700 bg-[#6B9AD9] border-red-400 p-2 rounded-[8px]" href="/projects/{project.id}/management/registration"
							>Edit registration form</a
						>
						{:else}
						<a class="ml-auto text-white font-bold text-sm hover:bg-blue-700 bg-[#6B9AD9] p-2 rounded-[8px]" href="/projects/{project.id}/management/registration"
							>Add registration form</a
						>
						{/if}
				</div>
				
				{#if !project.registration}
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
