<script lang="ts">
	import { onMount } from 'svelte';

	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import Filterer from '$lib/components/Filterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { CustomContact } from '$lib/types/CustomContact';
	import type { Contact } from '$lib/types/Contact';

	let contacts: CustomContact[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 10,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};
	let url: string = '/api/contacts';
	let urlFront: string = '/contacts';
	let uniqueUrl: string = '/contacts';

	let dataHolder: TableData<CustomContact>;

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);
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

		if (browser) goto(`${urlFront}${optionInUrls}`);

		const response = await fetch(`${url}${optionInUrls}`, {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			const data = await response.json();

			let tmpContacts: Contact[] = data.data;

			contacts = tmpContacts.map((contact) => {
				return {
					...contact,
					instruments: contact.instruments
						.map((instrument) => {
							return `${instrument.name} - ${instrument.pivot_proficiency_level} - ${instrument.family}`;
						})
						.join(', ')
				};
			});
			meta = data.meta;

			dataHolder = {
				data: contacts,
				columns: [
					'id',
					'firstName',
					'lastName',
					'email',
					'messenger',
					'phone',
					'comments'
				],
				notOrderedColumns: [
					'instruments'
				]
			};
		});
	}
</script>

<div>
	<div class="flex justify-center p-4">
		<div class="flex p-2 border-2 border-rose-500">
			<a href="/contacts/create">add new contact</a>
		</div>
		<div class="flex p-2 border-2 border-rose-500">
			<a href="/contacts/lists">show the existants lists</a>
		</div>
		<div class="flex p-2 border-2 border-rose-500">
			<a href="/contacts/lists/create">create new list</a>
		</div>
		<div class="flex p-2 border-2 border-rose-500">
			<a href="/contacts/import">import</a>
		</div>
	</div>

	{#if dataHolder}
		<Filterer showData={true} bind:data={dataHolder} bind:meta bind:options bind:uniqueUrl on:optionsUpdated={()=>fetchData()}></Filterer>
	{/if}
</div>
