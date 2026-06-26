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
		limit: 250,
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

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);
		options = {
			filter: urlParams.get('filter') || options.filter,
			limit: parseInt(urlParams.get('limit') || options.limit.toString()),
			page: parseInt(urlParams.get('page') || options.page.toString()),
			order: urlParams.get('order') || options.order,
			orderBy: urlParams.get('orderBy') || options.orderBy
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

			allProjects = data.data;
			meta = data.meta;

			passedProjects = allProjects.filter((project: Project) =>
				project.concerts.every((concert: any) => new Date(concert.startDate) < new Date())
			);

			currentProjects = allProjects.filter((project: Project) =>
				project.concerts.some((concert: any) => new Date(concert.startDate) >= new Date())
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

	function getPendingRegistrationsCount(project: Project) {
		const participants = project.participants as Array<{ accepted?: boolean }> | undefined;

		return participants?.filter((participant) => participant.accepted === false).length || 0;
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
					<SimpleFilterer
						showData={false}
						bind:data={group}
						bind:meta
						bind:options
						on:optionsUpdated={() => fetchData()}
					>
						<div class=" bg-white bordermx-auto justify-center w-full">
							{#each shownProjects as project}
								<div
									class="bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-200 focus:ring-gray-100 cursor-pointer"
								>
									<a href={`/projects/${project.id}/management`} class="block p-3">
										<div class="flex flex-wrap items-start justify-between gap-2">
											<h2 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
												{project.name}
											</h2>
											{#if getPendingRegistrationsCount(project) > 0}
												<span
													class="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700"
												>
													{getPendingRegistrationsCount(project)}
													new registration{getPendingRegistrationsCount(project) > 1 ? 's' : ''}
												</span>
											{/if}
										</div>
										<ul class="text-sm">
											{#each project.concerts as concert}
												<DateShow
													startTime={concert.startDate}
													endTime={concert.endDate}
													withDate={true}
													withTime={true}
												/>
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
