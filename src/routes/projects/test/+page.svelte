<script lang="ts">
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import { onMount } from 'svelte';
	import Filterer from '../../../lib/components/Filterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { Project } from '$lib/types/Project';

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
	let urlFront: string = '/projects/test';

	let group: TableData<Project>;

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
				columns: ['name', 'registrationId','sectionGroupId','id']
			};
		});
	}
</script>

{#if group}
	<Filterer bind:data={group} bind:meta bind:options>
		{#each projects as project}
			<div class="border-2 border-blue-500">
				<h2>{project.name}</h2>
				<ul>
					{#each project.concerts as concert}
						<li>{concert.date.toLocaleDateString()} - {concert.place}</li>
					{/each}
				</ul>
			</div>
		{/each}
	</Filterer>
{/if}
