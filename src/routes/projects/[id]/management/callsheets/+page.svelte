<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import type { Callsheet } from '$lib/types/Callsheet.js';
	import type { TableData } from '$lib/types/TableData';
	import { onMount } from 'svelte';

	export let data;

	let callsheets: Callsheet[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 250,
		page: 1,
		order: 'desc',
		orderBy: 'updatedAt'
	};
	let urlSvelteApi: string;
	let urlFront: string;
	let uniqueUrl: string;

	let dataHolder: TableData<Callsheet>;

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);

		urlSvelteApi = `/api/projects/${data.id}/management/callsheets`;
		urlFront = `/projects/${data.id}/management/callsheets`;
		uniqueUrl = `/projects/${data.id}/management/callsheets`;
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

		if (browser && data.id) goto(`${urlFront}${optionInUrls}`);

		const response = await fetch(`${urlSvelteApi}${optionInUrls}`, {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			const data = await response.json();

			callsheets = data.data.map((callsheet: Callsheet) => {
				return {
					...callsheet,
					updatedAt: new Date(callsheet.updatedAt),
					createdAt: new Date(callsheet.createdAt)
				};
			});
			meta = data.meta;

			dataHolder = {
				data: callsheets,
				columns: ['version', 'updatedAt'],
				notOrderedColumns: []
			};
		});
	}

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

<SimpleFilterer
	showData
	bind:data={dataHolder}
	bind:meta
	bind:options
	bind:uniqueUrl
	on:optionsUpdated={fetchData}
></SimpleFilterer>

<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-start">
	<button
		on:click={() => goto(`${urlFront}/creation`)}
		class="w-full sm:w-auto text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm md:text-base px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 transition duration-300"
	>
		Add a callsheet
	</button>

	{#if callsheets.length > 0}
		<a
			href="/projects/{data.id}/management/callsheets/{maxUpdateDate(callsheets).id}/creation"
			class="w-full sm:w-auto text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm md:text-base px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 transition duration-300"
		>
			Create a new callsheet from the last one
		</a>
	{/if}
</div>
