<script lang="ts">
	import DateShow from '$lib/components/DateShow.svelte';
	import DisplayerEvents from './DisplayerEvents.svelte';
	import DisplayerFolder from './DisplayerFolder.svelte';
	import DisplayerPieces from './DisplayerPieces.svelte';
	import DisplayerSheets from './DisplayerSheets.svelte';

	export let project: any;
	export let participantsNotSeenCallsheet: Array<any>;
	export let participantsNotValidated: Array<any>;
	export let participantsWithoutEmail: Array<any>;
</script>

<div class="w-full">
	<div class="border border-red-300 w-fit">
		<h2 class="m-2 text-lg">Important informations</h2>
		<ul>
			{#if participantsWithoutEmail.length === 0}
				<li class="text-sm">No participant without email</li>
			{:else}
				<li class="text-sm">Participants without email:</li>
				{#each participantsWithoutEmail as participant}
					<li class="text-sm">
						<a href="/projects/{project.id}/management/participants/{participant.id}">
							{participant.contact.firstName}
							{participant.contact.lastName}
							(Participant profile)
						</a>
						<a href="/contacts/{participant.contact.id}">(Profile)</a>
					</li>
				{/each}
			{/if}
		</ul>
	</div>
	<div class="flex flex-col md:flex-row">
		<div
			class="grid grid-cols-1 space-y-1 w-full md:w-5/12 m-1 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
		>
			<div class="text-sm">
				Created at: <DateShow date={project.createdAt} />
			</div>
			<div class="text-sm">
				Updated at: <DateShow date={project.updatedAt} />
			</div>
			<div class="text-sm">
				Responsibles:
				{#each project.responsibles as responsible}
					<a href="/contacts/{responsible.id}" class="rounded-full bg-slate-100 p-1"
						>{responsible.firstName} {responsible.lastName}</a
					>
				{/each}
			</div>
			<a
				href="/projects/{project.id}/management/modify"
				class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
			>
				Modify project infos
			</a>
			<a
				href="/projects/{project.id}/management/participants"
				class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
			>
				Participants
			</a>
			<a
				href="/projects/{project.id}/management/attendance"
				class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
			>
				See attendance
			</a>
			<a
				href="/projects/{project.id}/management/mails"
				class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
			>
				Mail manager
			</a>
		</div>

		<div class="m-1 w-full md:w-7/12">
			<DisplayerPieces bind:project />
		</div>
	</div>

	<div class="flex flex-col md:flex-row">
		<div class="m-1 w-full md:w-1/2">
			<DisplayerSheets
				bind:project
				bind:participantsNotSeenCallsheet
				bind:participantsNotValidated
			/>
		</div>
		<div class="m-1 w-full md:w-1/2">
			<DisplayerEvents bind:project />
		</div>
	</div>

	<div class="flex flex-col md:flex-row">
		<div class="m-1 w-full md:w-1/2">
			<DisplayerFolder bind:project />
		</div>
		<div class="m-1 w-full md:w-1/2"></div>
	</div>
</div>
