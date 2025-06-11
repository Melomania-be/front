<script lang="ts">
	import type { Project } from '$lib/types/Project';
	import type { Participant } from '$lib/types/Participant';
	import type { Callsheet } from '$lib/types/Callsheet';

	export let project: Project;
	export let participantsSeenCallsheet: Array<Participant>;
	export let participantsNotValidated: Array<Participant>;

	console.log("Project : " , project)

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
</script>

<div class="w-full ">
	<div class="flex gap-6 w-full">
			<div class="border-[#8C8C8C] rounded-[10px] border-2 p-4 bg-white rounded-lg w-full">
				<div class="flex mb-4">
					<h1 class="font-bold text-lg">CALLSHEET</h1>
					<ul class="divide-y divide-gray-200 dark:divide-gray-700">
						{#if project.callsheets}
							{#each project.callsheets.reverse() as callsheets}
								<li class="py-3 sm:py-4">
									<div class="flex items-center justify-between">
										<div class="flex items-center space-x-1">
											<a href="/projects/{project.id}/management/callsheets/{callsheets.id}">
												<h3 class="text-sm font-medium text-gray-900 dark:text-white">
													{callsheets.version}
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
				{#if project.participants}
					<div class="flex mt-1">
						<div class="w-full bg-gray-200 rounded-full dark:bg-gray-700">
							<div
								class="h-1 bg-[#6B9AD9] text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
								style="width: {((project.participants.length - participantsSeenCallsheet.length) /
									project.participants.length) *
									100}%;"
							></div>
						</div>
					</div>
					<div>
						{project.participants.length - participantsSeenCallsheet.length} / {project.participants
							.length} participants have seen the last callsheet
					</div>
				{/if}
				<div class="mt-2">
					<h3>Participants who have not seen the last callsheet :</h3>
					<ul>
						{#each participantsSeenCallsheet.slice(0, 3) as participant}
							<li class="text-sm">
								<a href="/projects/{project.id}/management/participants/{participant.id}">
									{participant.contact.firstName}
									{participant.contact.lastName}
									(Participant profile)
								</a>
								<a href="/contacts/{participant.contact.id}">(Profile)</a>
							</li>
						{/each}
						<li>...</li>
					</ul>
				</div>
			</div>

			<div class="border-[#8C8C8C] rounded-[10px] border-2 p-4 bg-white rounded-lg w-full">
				<div class="flex items-center">
						<h1 class="font-bold text-lg">REGISTRATION</h1>
						<a class="ml-auto text-white font-bold text-sm hover:bg-blue-700 bg-[#6B9AD9] p-2 rounded-[8px]" href="/projects/{project.id}/management/registration"
							>Edit registration form</a
						>
				</div>
			</div>
	</div>
</div>
