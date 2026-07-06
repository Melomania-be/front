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
			const now = Date.now();

			allProjects = sortProjectsByDate(data.data, now);
			meta = data.meta;

			passedProjects = sortPassedProjects(
				allProjects.filter((project: Project) => isPassedProject(project, now))
			);

			currentProjects = sortCurrentProjects(
				allProjects.filter((project: Project) => isCurrentProject(project, now)),
				now
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

	function getDateTime(date: Date | string | null | undefined) {
		const time = new Date(date ?? '').getTime();

		return Number.isNaN(time) ? null : time;
	}

	function getConcertTimes(project: Project) {
		return project.concerts
			.map((concert) => getDateTime(concert.startDate))
			.filter((time): time is number => time !== null)
			.sort((a, b) => a - b);
	}

	function isPassedProject(project: Project, now: number) {
		return project.concerts.every((concert) => {
			const concertTime = getDateTime(concert.startDate);

			return concertTime !== null && concertTime < now;
		});
	}

	function isCurrentProject(project: Project, now: number) {
		return project.concerts.some((concert) => {
			const concertTime = getDateTime(concert.startDate);

			return concertTime !== null && concertTime >= now;
		});
	}

	function getNextConcertTime(project: Project, now: number) {
		return getConcertTimes(project).find((time) => time >= now) ?? null;
	}

	function getLastConcertTime(project: Project) {
		const concertTimes = getConcertTimes(project);

		return concertTimes.length > 0 ? concertTimes[concertTimes.length - 1] : null;
	}

	function compareProjectNames(projectA: Project, projectB: Project) {
		return projectA.name.localeCompare(projectB.name);
	}

	function sortCurrentProjects(projects: Project[], now: number) {
		return [...projects].sort((projectA, projectB) => {
			const nextConcertA = getNextConcertTime(projectA, now);
			const nextConcertB = getNextConcertTime(projectB, now);

			if (nextConcertA !== null && nextConcertB !== null) {
				return nextConcertA - nextConcertB || compareProjectNames(projectA, projectB);
			}

			if (nextConcertA !== null) return -1;
			if (nextConcertB !== null) return 1;

			return compareProjectNames(projectA, projectB);
		});
	}

	function sortPassedProjects(projects: Project[]) {
		return [...projects].sort((projectA, projectB) => {
			const lastConcertA = getLastConcertTime(projectA);
			const lastConcertB = getLastConcertTime(projectB);

			if (lastConcertA !== null && lastConcertB !== null) {
				return lastConcertB - lastConcertA || compareProjectNames(projectA, projectB);
			}

			if (lastConcertA !== null) return -1;
			if (lastConcertB !== null) return 1;

			return compareProjectNames(projectA, projectB);
		});
	}

	function sortProjectsByDate(projects: Project[], now: number) {
		return [...projects].sort((projectA, projectB) => {
			const nextConcertA = getNextConcertTime(projectA, now);
			const nextConcertB = getNextConcertTime(projectB, now);

			if (nextConcertA !== null && nextConcertB !== null) {
				return nextConcertA - nextConcertB || compareProjectNames(projectA, projectB);
			}

			if (nextConcertA !== null) return -1;
			if (nextConcertB !== null) return 1;

			const lastConcertA = getLastConcertTime(projectA);
			const lastConcertB = getLastConcertTime(projectB);

			if (lastConcertA !== null && lastConcertB !== null) {
				return lastConcertB - lastConcertA || compareProjectNames(projectA, projectB);
			}

			if (lastConcertA !== null) return -1;
			if (lastConcertB !== null) return 1;

			return compareProjectNames(projectA, projectB);
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
									<a href={`/projects/${project.id}/management`}>
										<h2 class="text-sm">{project.name}</h2>
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
