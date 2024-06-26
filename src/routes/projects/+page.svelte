<script lang="ts">
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import DateShow from '$lib/components/DateShow.svelte';
	import { onMount } from 'svelte';

	type Project = any;

	let projectsDone: Project = [];
	let projectsToDo: Project = [];

	onMount(async () => {
		let response = await fetch('/api/projects', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		const responseHandlerClient = new ResponseHandlerClient();

		responseHandlerClient.handle(response, async () => {
			const data = (await response.json()).map((project: Project) => {
				project.concerts = project.concerts.map((concert: any) => {
					concert.date = new Date(concert.date);
					return concert;
				});
				return project;
			});
			projectsDone = data.filter((project: Project) =>
				project.concerts.every((concert: any) => concert.date < new Date())
			);
			projectsToDo = data.filter((project: Project) =>
				project.concerts.some((concert: any) => concert.date >= new Date())
			);
		});
	});
</script>

<div class="grid grid-cols-1 w-full p-2">
	<h1 class="w-full text-center p-4">Choose project</h1>
	<button
		type="button"
		class="w-fit text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
		>New project</button
	>
	<div class="m-2">
		{#each projectsToDo as project}
			<div class="border border-gray-500 rounded p-2.5 mb-2">
				<h2>{project.name}</h2>
				<div>
					<h4>Concerts :</h4>
					<ul>
						{#each project.concerts as concert}
							<DateShow bind:date={concert.date} />
						{/each}
					</ul>
				</div>
				<div>
					<button
						type="button"
						class="w-fit text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
						>Edit</button
					>
				</div>
			</div>
		{/each}
	</div>
	<div class="m-2">
		{#each projectsDone as project}
			<div class="border border-gray-500 rounded p-2.5 mb-2 opacity-60 hover:opacity-100">
				<h2>{project.name}</h2>
				<div>
					<h4>Concerts :</h4>
					<ul>
						{#each project.concerts as concert}
							<DateShow bind:date={concert.date} />
						{/each}
					</ul>
				</div>
				<button
					type="button"
					class="w-fit text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 opacity-60"
					disabled>Edit</button
				>
			</div>
		{/each}
	</div>
</div>
