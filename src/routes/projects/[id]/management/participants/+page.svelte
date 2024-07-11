<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import type { Participant } from '$lib/types/Participant';
	import type { TableData } from '$lib/types/TableData';
	import { onMount } from 'svelte';

	export let data;

	let participants: Participant[] = [];
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

	let dataHolder: TableData<Participant>;

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);

		urlSvelteApi = `/api/projects/${data.id}/management/participants`;
		urlFront = `/projects/${data.id}/management/participants`;
		uniqueUrl = `/projects/${data.id}/management/participants`;
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

			participants = data.data;
			meta = data.meta;

			dataHolder = {
				data: participants,
				columns: ['id'],
				notOrderedColumns: []
			};
		});
	}
</script>

<SimpleFilterer
	bind:data={dataHolder}
	bind:meta
	bind:options
	bind:uniqueUrl
	on:optionsUpdated={fetchData}
>
	{#each participants as participant}
		<a href="{uniqueUrl}/{participant.id}">
			{participant.id}
			{participant.contact.firstName}
			{participant.contact.lastName}
			{participant.contact.email}
			{participant.contact.phone}
			{participant.contact.messenger}
		</a>
	{/each}
</SimpleFilterer>

<button on:click={() => goto(`${urlFront}/creation`)}>Add a participant</button>