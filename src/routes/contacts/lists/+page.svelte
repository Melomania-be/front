<script lang="ts">
	import { onMount } from 'svelte';

	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { List } from '$lib/types/List';
	import type { CustomList } from '$lib/types/CustomList';

	let lists: CustomList[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 250,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};
	let url: string = '/api/lists';
	let urlFront: string = '/contacts/lists';
	let uniqueUrl: string = '/contacts/lists';

	let dataHolder: TableData<CustomList>;

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

			console.log(data);

			const tmpLists: List[] = data.data;

			lists = tmpLists.map((list) => {
				return {
					...list,
					contacts: list.contacts
						.map((contact) => {
							return `${contact.firstName} ${contact.lastName}`;
						})
						.join(' - ')
				};
			});

			meta = data.meta;

			dataHolder = {
				data: lists,
				columns: ['id', 'name'],
				notOrderedColumns: ['contacts']
			};
		});
	}
</script>

<div>
	{#if dataHolder}
		<SimpleFilterer
			showData={true}
			bind:data={dataHolder}
			bind:meta
			bind:options
			bind:uniqueUrl
			on:optionsUpdated={() => fetchData()}
		></SimpleFilterer>
	{/if}
</div>
