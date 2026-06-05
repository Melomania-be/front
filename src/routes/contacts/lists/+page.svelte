<script lang="ts">
	import { onMount } from 'svelte';

	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { List } from '$lib/types/List';
	import type { CustomList } from '$lib/types/CustomList';
	import ModuleHeader from '$lib/components/ModuleHeader.svelte';
	import { List as ListIcon } from 'lucide-svelte';

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

	async function deleteList(list: CustomList) {
		if (!confirm(`Are you sure you want to delete "${list.name}"?`)) return;

		const response = await fetch(`/api/lists/${list.id}`, {
			method: 'DELETE'
		});

		const responseHandler = new ResponseHandlerClient();
		responseHandler.handle(response, async () => {
			lists = lists.filter((currentList) => currentList.id !== list.id);
			if (dataHolder) {
				dataHolder = {
					...dataHolder,
					data: lists
				};
			}
			await fetchData();
		});
	}
</script>

<div class="bg-[#E7E7E7] min-h-screen pb-4">
	<ModuleHeader
		title="Contact Lists"
		description="Manage your custom contact lists and mailing groups"
		icon={ListIcon}
		on:refresh={() => fetchData()}
	/>

	<div class="border-2 border-gray-500 rounded-xl p-4 bg-white m-4">
		{#if dataHolder}
			<SimpleFilterer
				showData={false}
				bind:data={dataHolder}
				bind:meta
				bind:options
				bind:uniqueUrl
				on:optionsUpdated={() => fetchData()}
			>
				{#if lists.length > 0}
					<div class="mt-4 w-full overflow-x-auto">
						<table class="w-full min-w-[520px] text-left text-sm text-gray-700">
							<thead class="bg-gray-100 text-xs uppercase text-gray-600">
								<tr>
									<th class="px-4 py-3">Name</th>
									<th class="px-4 py-3">Contacts</th>
									<th class="px-4 py-3 text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each lists as list (list.id)}
									<tr class="border-b bg-white hover:bg-gray-50">
										<td class="px-4 py-3 font-medium text-gray-900">
											<a class="hover:underline" href="/contacts/lists/{list.id}">{list.name}</a>
										</td>
										<td class="max-w-[520px] truncate px-4 py-3" title={list.contacts}>
											{list.contacts || 'No contacts'}
										</td>
										<td class="px-4 py-3 text-right">
											<button
												type="button"
												class="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
												on:click={() => deleteList(list)}
											>
												Delete
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p class="mt-4 w-full text-center text-gray-500">No lists found</p>
				{/if}
			</SimpleFilterer>
		{/if}
	</div>
</div>
