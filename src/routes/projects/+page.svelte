<script lang="ts">
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import { onMount } from 'svelte';
	import SimpleFilterer from '../../lib/components/SimpleFilterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { Project } from '$lib/types/Project';
	import DateShow from '$lib/components/DateShow.svelte';
	import Button from '$lib/components/Button.svelte';

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

			allProjects = data.data.map((project: Project) => {
				project.concerts = project?.concerts?.map((concert: any) => {
					concert.startDate = new Date(concert.startDate);
					return concert;
				});
				return project;
			});
			meta = data.meta;

			passedProjects = allProjects.filter((project: Project) =>
				project.concerts.every((concert: any) => concert.startDate < new Date())
			);

			currentProjects = allProjects.filter((project: Project) =>
				project.concerts.some((concert: any) => concert.startDate >= new Date())
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

<div class="p-4">
	<div class="mb-6 border-b border-gray-200 pb-4">
		<ul class="flex flex-wrap items-center gap-2">
			<li>
				<Button
					variant={shownProjectsArray === 'passedProjects' ? 'primary' : 'ghost'}
					on:click={() => {
       shownProjectsArray = 'passedProjects';
       shownProjects = passedProjects;
      }}
				>
					Passed projects
				</Button>
			</li>
			<li>
				<Button
					variant={shownProjectsArray === 'currentProjects' ? 'primary' : 'ghost'}
					on:click={() => {
       shownProjectsArray = 'currentProjects';
       shownProjects = currentProjects;
      }}
				>
					Current projects
				</Button>
			</li>
			<li>
				<Button
					variant={shownProjectsArray === 'allProjects' ? 'primary' : 'ghost'}
					on:click={() => {
       shownProjectsArray = 'allProjects';
       shownProjects = allProjects;
      }}
				>
					All projects
				</Button>
			</li>
			<li class="ml-auto">
				<Button href="/projects/creation" variant="primary">
					<svg class="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
					</svg>
					Create a new project
				</Button>
			</li>
		</ul>
	</div>

	{#if group}
		<div>
			{#if shownProjectsArray}
				<div class="bg-white border border-gray-200 rounded-lg shadow p-4">
					<SimpleFilterer
						showData={false}
						bind:data={group}
						bind:meta
						bind:options
						on:optionsUpdated={() => fetchData()}
					>
						<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4 w-full">
							{#each shownProjects as project}
								<div class="bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 transition-colors">
									<a href={`/projects/${project.id}/management`} class="block p-5 h-full">
										<h2 class="text-lg font-semibold text-gray-900 mb-2">{project.name}</h2>

										{#if project.concerts && project.concerts.length > 0}
											<ul class="text-sm text-gray-600 space-y-2 mt-3">
												{#each project.concerts as concert}
													<li class="flex items-start">
														<svg class="w-4 h-4 mr-2 mt-0.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
														</svg>
														<span>
                <DateShow startTime={concert.startDate} endTime={concert.endDate} />
                <span class="block text-gray-500">{concert.place}</span>
               </span>
													</li>
												{/each}
											</ul>
										{:else}
											<p class="text-sm text-gray-400 italic mt-3">No concerts scheduled</p>
										{/if}
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