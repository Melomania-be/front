<script lang="ts">
	import DateShow from '$lib/components/DateShow.svelte';
	import DisplayerEvents from './DisplayerEvents.svelte';
	import DisplayerFolder from './DisplayerFolder.svelte';
	import DisplayerPieces from './DisplayerPieces.svelte';
	import DisplayerSheets from './DisplayerSheets.svelte';
	import Notification from './Notification.svelte';

	export let project: any;
	export let participantsNotSeenCallsheet: Array<any>;
	export let participantsNotValidated: Array<any>;
	export let participantsWithoutEmail: Array<any>;
</script>

<div class="w-full">
	<Notification bind:participantsWithoutEmail bind:project bind:participantsNotValidated />

	<div class="flex flex-col md:flex-row">
		<div
			class="flex-col space-y-1 w-full md:w-5/12 m-1 p-6 bg-white border border-black rounded-tl-lg shadow dark:bg-gray-800 dark:border-gray-700"
		>
			<div class="text-sm">
				Created at: <DateShow startTime={project.createdAt} />
			</div>
			<div class="text-sm">
				Updated at: <DateShow startTime={project.updatedAt} />
			</div>
			<div class="text-sm">
				Project managers:
				{#if project.responsibles && project.responsibles.length === 0}
					No project manager
				{:else}
					{#each project.responsibles as responsible}
						<a href="/contacts/{responsible.id}" class="rounded-full bg-slate-100 p-1"
							>{responsible.firstName} {responsible.lastName}</a
						>
					{/each}
				{/if}
			</div>
			<div class="grid grid-cols-2 gap-1">
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
					href="/projects/{project.id}/management/mailing"
					class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					Mail manager
				</a>
				<a
					href="/projects/{project.id}/management/callsheets"
					class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					See all callsheets
				</a>
				<a
					href="/projects/{project.id}/management/validation"
					class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					New participant validation
				</a>
			</div>
		</div>

		<div class="m-1 w-full md:w-7/12">
			<DisplayerPieces bind:project />
		</div>
	</div>

	<div class="flex flex-col md:flex-row">
		<div class="m-1 w-full md:w-1/2">
			<DisplayerSheets
				bind:project
				bind:participantsSeenCallsheet={participantsNotSeenCallsheet}
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
	</div>
</div>
