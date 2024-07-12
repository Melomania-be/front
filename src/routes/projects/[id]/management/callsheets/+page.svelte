<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { updated } from '$app/stores';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import DateShow from '$lib/components/DateShow.svelte';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import type { Callsheet } from '$lib/types/Callsheet.js';
	import type { TableData } from '$lib/types/TableData';
	import { onMount } from 'svelte';

	export let data;

	let callsheets: Callsheet[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 10,
		page: 1,
		order: 'asc',
		orderBy: 'id'
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
			filter: urlParams.get('filter') || '',
			limit: parseInt(urlParams.get('limit') || '5'),
			page: parseInt(urlParams.get('page') || '1'),
			order: urlParams.get('order') || 'asc',
			orderBy: urlParams.get('orderBy') || 'id'
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
</script>

<SimpleFilterer
showData
	bind:data={dataHolder}
	bind:meta
	bind:options
	bind:uniqueUrl
	on:optionsUpdated={fetchData}
>
</SimpleFilterer>

<button on:click={() => goto(`${urlFront}/creation`)}>Add a participant</button>
