<script lang="ts">
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import { onMount } from 'svelte';
	import Filterer from '../../lib/components/Filterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { Project } from '$lib/types/Project';

	let aaaaa: string = '';
	let projectsDone: Project[] = [];
	let projectsToDo: Project[] = [];
	let projects: Project[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 10,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};
	let url: string = '/api/projects';
	let urlFront: string = '/projects/';
	let allProjects: boolean = true;
	let currentProjects: boolean = false;
	let passedProjects: boolean = false;

	let group: TableData<Project>;
	let groupDone: TableData<Project>;
	let groupCurrent: TableData<Project>;

	$: if (browser) options && fetchData();
	$: console.log(projects);
	$: console.log(options.order);
	$: console.log(meta);
	$: console.log(options);

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);
		options = {
			filter: urlParams.get('filter') || '',
			limit: parseInt(urlParams.get('limit') || '10'),
			page: parseInt(urlParams.get('page') || '1'),
			order: urlParams.get('order') || 'asc',
			orderBy: urlParams.get('orderBy') || 'name'
		};

		fetchData();
	});

	async function fetchData() {
		let optionInUrls = `?page=${options.page}&limit=${options.limit}`;
		optionInUrls += '&filter=' + options.filter;
		optionInUrls += '&orderBy=' + options.orderBy;
		optionInUrls += '&order=' + options.order;

		if (browser) goto(`${urlFront}${optionInUrls}`);

		const response = await fetch(`${url}${optionInUrls}`, {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			const data = await response.json();

			projects = data.data.map((project: Project) => {
				project.concerts = project?.concerts?.map((concert: any) => {
					concert.date = new Date(concert.date);
					return concert;
				});
				return project;
			});
			meta = data.meta;

			projectsDone = projects.filter((project: Project) =>
				project.concerts.every((concert: any) => concert.date < new Date())
			);

			projectsToDo = projects.filter((project: Project) =>
				project.concerts.some((concert: any) => concert.date >= new Date())
			);

			group = {
				data: projects,
				columns: ['name', 'registrationId', 'sectionGroupId', 'id'],
				notOrderedColumns: []
			};

			groupDone = {
				data: projectsDone,
				columns: ['name', 'registrationId', 'sectionGroupId', 'id'],
				notOrderedColumns: []
			};

			groupCurrent = {
				data: projectsToDo,
				columns: ['name', 'registrationId', 'sectionGroupId', 'id'],
				notOrderedColumns: []
			};

			console.log('All projects', projects);
			console.log('Done projects', projectsDone);
			console.log('Current projects', projectsToDo);
		});
	}
</script>

<main>
	<br />

	<!--
	<div class="mb-2  grid grid-cols-2">
		<a href="/projects/create" class="bg-blue-700 text-sm px-2 py-1 mr-2 rounded-lg text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 text-center" >Create a new project</a>
		{#if !allProjects}
		<button class="bg-red-500 text-sm px-2 py-1 mr-2 rounded-lg text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300"
		on:click={() => allProjects = true} >See all projects</button>
		{:else}
		{#if !currentProjects}
		<button class="bg-red-500 text-sm px-2 py-1 mr-2 rounded-lg text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300"
		on:click={() => allProjects = false} >See passed projects</button>
		{:else}
		<button class="bg-red-500 text-sm px-2 py-1 mr-2 rounded-lg text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300"
		on:click={() => currentProjects = false} >See current projects</button>
		{/if}
		{/if}
	</div>
-->
	<div class="mb-2 grid grid-cols-3">
		<a
			href="/projects/create"
			class="bg-blue-700 text-sm px-2 py-1 rounded-lg text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 text-center"
		>
			Create a new project
		</a>
		{#if !allProjects}
			<button
				class="bg-red-500 text-sm px-2 py-1 rounded-lg text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300"
				on:click={() => {
					allProjects = true;
					currentProjects = false;
					passedProjects = false;
				}}
			>
				See all projects
			</button>
		{/if}
		{#if !currentProjects}
			<button
				class="bg-red-500 text-sm px-2 py-1 rounded-lg text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300"
				on:click={() => {
					currentProjects = true;
					allProjects = false;
					passedProjects = false;
				}}
			>
				See current projects
			</button>
		{/if}
		{#if !passedProjects}
			<button
				class="bg-red-500 text-sm px-2 py-1 rounded-lg text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300"
				on:click={() => {
					passedProjects = true;
					currentProjects = false;
					allProjects = false;
				}}
			>
				See passed projects
			</button>
		{/if}
	</div>
	<br />

	{#if allProjects === true}
		<div
			class="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 flex items-center justify-center"
		>
			<h1>All projects</h1>
		</div>
		<div>
			{#if group}
				<div
					class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 ml-10 mr-10"
				>
					<Filterer
						showData={false}
						bind:data={group}
						bind:meta
						bind:options
						bind:uniqueUrl={aaaaa}
					>
						<div class=" bg-white bordermx-auto justify-center col col-1">
							{#each projects as project}
								<button
									class="w-full col-1 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-200 focus:ring-gray-100 cursor-pointer"
									on:click={() => (window.location.href = `/projects/${project.id}`)}
									role="button"
								>
									<h2>{project.name}</h2>
									<ul>
										{#each project.concerts as concert}
											<li>{concert.date.toLocaleDateString()} - {concert.place}</li>
										{/each}
									</ul>
								</button>
								<br />
							{/each}
						</div>
					</Filterer>
				</div>
			{/if}
		</div>
	{/if}

	{#if currentProjects === true}
		{#if groupCurrent}
			<div
				class="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 flex items-center justify-center"
			>
				<h1>Current projects</h1>
			</div>
			<div
				class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 ml-10 mr-10"
			>
				<Filterer
					showData={false}
					bind:data={groupCurrent}
					bind:meta
					bind:options
					bind:uniqueUrl={aaaaa}
				>
					<div class=" bg-white bordermx-auto justify-center col col-1">
						{#each projects as project}
							<button
								class="w-full col-1 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-200 focus:ring-gray-100 cursor-pointer"
								on:click={() => (window.location.href = `/projects/${project.id}`)}
								role="button"
							>
								<h2>{project.name}</h2>
								<ul>
									{#each project.concerts as concert}
										<li>{concert.date.toLocaleDateString()} - {concert.place}</li>
									{/each}
								</ul>
							</button>
							<br />
						{/each}
					</div>
				</Filterer>
			</div>
		{:else}
			<div
				class="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 flex items-center justify-center"
			>
				<h1>No current projects</h1>
			</div>
		{/if}
	{/if}

	{#if passedProjects === true}
		<div
			class="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 flex items-center justify-center"
		>
			<h1>Passed projects</h1>
		</div>
		<div
			class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 ml-10 mr-10"
		>
			<Filterer
				showData={false}
				bind:data={groupDone}
				bind:meta
				bind:options
				bind:uniqueUrl={aaaaa}
			>
				<div class=" bg-white bordermx-auto justify-center col col-1">
					{#each projects as project}
						<button
							class="w-full col-1 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-200 focus:ring-gray-100 cursor-pointer"
							on:click={() => (window.location.href = `/projects/${project.id}`)}
							role="button"
						>
							<h2>{project.name}</h2>
							<ul>
								{#each project.concerts as concert}
									<li>{concert.date.toLocaleDateString()} - {concert.place}</li>
								{/each}
							</ul>
						</button>
						<br />
					{/each}
				</div>
			</Filterer>
		</div>
	{/if}
</main>
