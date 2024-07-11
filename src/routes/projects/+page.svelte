<script lang="ts">
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import { onMount } from 'svelte';
	import SimpleFilterer from '../../lib/components/SimpleFilterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { Project } from '$lib/types/Project';
	import DateShow from '$lib/components/DateShow.svelte';

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

	let group: TableData<Project>;

	let shownProjectsArray: string = 'allProjects';
	let shownProjects: Project[] = [];

	let allProjects: Project[] = [];
	let passedProjects: Project[] = [];
	let currentProjects: Project[] = [];

	$: if (browser) options && fetchData();

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

			allProjects = data.data.map((project: Project) => {
				project.concerts = project?.concerts?.map((concert: any) => {
					concert.date = new Date(concert.date);
					return concert;
				});
				return project;
			});
			meta = data.meta;

			passedProjects = allProjects.filter((project: Project) =>
				project.concerts.every((concert: any) => concert.date < new Date())
			);

			currentProjects = allProjects.filter((project: Project) =>
				project.concerts.some((concert: any) => concert.date >= new Date())
			);

			group = {
				data: allProjects,
				columns: ['name'],
				notOrderedColumns: []
			};

			shownProjects = allProjects;
			shownProjectsArray = 'allProjects';
		});
	}
</script>

<div>
	<div
		class="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700"
	>
		<ul class="flex flex-wrap">
			<li class="me-2">
				<button
					class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 {shownProjectsArray ===
					'passedProjects'
						? 'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500'
						: ''}"
					on:click={() => {
						shownProjectsArray = 'passedProjects';
						shownProjects = passedProjects;
					}}>Passed projects</button
				>
			</li>
			<li class="me-2">
				<button
					class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 {shownProjectsArray ===
					'currentProjects'
						? 'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500'
						: ''}"
					aria-current="page"
					on:click={() => {
						shownProjectsArray = 'currentProjects';
						shownProjects = currentProjects;
					}}>Current projects</button
				>
			</li>
			<li class="me-2">
				<button
					class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 {shownProjectsArray ===
					'allProjects'
						? 'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500'
						: ''}"
					on:click={() => {
						shownProjectsArray = 'allProjects';
						shownProjects = allProjects;
					}}>All projects</button
				>
			</li>
			<li class="me-2">
				<button
					class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
				>
					<a href="/projects/creation" class="border rounded-xl p-1">Create a new project</a>
				</button>
			</li>
		</ul>
	</div>
	{#if group}
		<div>
			{#if shownProjectsArray}
				<div
					class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 mb-1"
				>
					<SimpleFilterer showData={false} bind:data={group} bind:meta bind:options>
						<div class=" bg-white bordermx-auto justify-center w-full">
							{#each shownProjects as project}
								<div
									class="bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-200 focus:ring-gray-100 cursor-pointer"
								>
									<a href={`/projects/${project.id}/management`}>
										<h2 class="text-sm">{project.name}</h2>
										<ul class="text-sm">
											{#each project.concerts as concert}
												<DateShow date={concert.date} />
												- {concert.place}
											{/each}
										</ul>
									</a>
								</div>
							{/each}
						</div>
					</SimpleFilterer>
				</div>
			{/if}
		</div>
	{/if}
</div>
