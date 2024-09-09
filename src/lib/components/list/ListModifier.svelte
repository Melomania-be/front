<script lang="ts">
	import { onMount } from 'svelte';

	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { Contact } from '$lib/types/Contact';
	import type { List } from '$lib/types/List';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';

	export let mode: 'modify' | 'create';
	export let url: string;
	export let urlFront: string;
	export let id: number | null = null;

	const newList: List = {
		id: null,
		name: '',
		contacts: [],
		mailTemplate: null,
		createdAt: '',
		updatedAt: ''
	};

	let contacts: (Contact & { checked: boolean })[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 250,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};

	let dataHolder: TableData<Contact & { checked: boolean }>;

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

		let response = await fetch(`${url}${optionInUrls}`, {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			const data = await response.json();

			contacts = data.data.map((contact: Contact) => {
				return {
					...contact,
					checked: false
				};
			});
			meta = data.meta;

			dataHolder = {
				data: [],
				columns: [],
				notOrderedColumns: []
			};
		});

		if (mode === 'modify' && id !== null) {
			let response2 = await fetch(`/api/lists/${id}`, {
				method: 'GET'
			});

			const responseHandler = new ResponseHandlerClient();

			let success = false;

			responseHandler.handle(response2, async () => {
				success = true;

				const data = await response2.json();

				newList.id = data.id;
				newList.name = data.name;
				newList.mailTemplate = data.mail_template;
				newList.createdAt = data.created_at;
				newList.updatedAt = data.updated_at;
				data.contacts.forEach((contact: any) => {
					newList.contacts.push(contact);
				});

				return;
			});

			if (!success) goto(`/contacts/lists/`);
		}
	}

	function addToList() {
		let newContacts: Contact[] = contacts
			.filter((contact) => contact.checked)
			.map((contact) => {
				const { checked, ...rest } = contact;
				return rest;
			});

		newContacts = newContacts.filter((contact) => {
			const exists = newList.contacts.find((c) => c.id === contact.id);
			return !exists;
		});

		newList.contacts = [...newList.contacts, ...newContacts];
	}

	async function save() {
		const tmpNewList = {
			...newList,
			contacts: newList.contacts.map((contact) => {
				return { id: contact.id, first_name: contact.firstName, last_name: contact.lastName };
			})
		};

		console.log(tmpNewList);

		const response = await fetch('/api/lists', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(tmpNewList)
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			goto('/contacts/lists');
		});
	}

	async function deleteList() {
		const response = await fetch(`/api/lists/${newList.id}`, {
			method: 'DELETE'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			goto('/contacts/lists');
		});
	}
</script>

<div class="grid grid-cols-6">
	<div class="m-2 border col-span-2">
		<h2 class="text-2xl font-semibold">List</h2>
		<button class="m-2" on:click={save}>Save</button>
		{#if mode === 'modify'}
			<button class="m-2" on:click={deleteList}>Delete</button>
		{/if}
		<input class="m-1" bind:value={newList.name} placeholder="List name" />
		<table class="border w-full">
			<tr>
				<th>Remove</th>
				<th>Name</th>
				<th>Instruments</th>
			</tr>
			{#if newList.contacts.length > 0}
				{#each newList.contacts as contact}
					<tr class="border">
						<td>
							<button
								class="m-2"
								on:click={() => {
									newList.contacts = newList.contacts.filter((c) => c.id !== contact.id);
								}}
							>
								<span
									class="icon-[icomoon-free--bin]"
									style="width: 1.2rem; height: 1.2rem; color: black;"
								></span>
							</button>
						</td>
						<td>{contact.firstName} {contact.lastName}</td>
						<td>
							{#each contact.instruments as instrument}
								{instrument.name} - {instrument.pivot_proficiency_level} - {instrument.family}<br />
							{/each}
						</td>
					</tr>
				{/each}
			{/if}
		</table>
	</div>
	<div class="col-span-4">
		{#if dataHolder}
			<button
				class="m-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				on:click={addToList}>Add to List</button
			>
			<SimpleFilterer
				bind:data={dataHolder}
				bind:meta
				bind:options
				on:optionsUpdated={() => fetchData()}
			>
				<div class="relative overflow-x-auto shadow-md sm:rounded-lg">
					<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
						<thead
							class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 border"
						>
							<tr>
								<th scope="col" class="p-4" rowspan="2">
									<div class="flex items-center">
										<input
											id="checkbox-all-search"
											type="checkbox"
											class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
											on:change={() => {
												contacts = contacts.map((contact) => {
													contact.checked = !contact.checked;
													return contact;
												});
											}}
										/>
										<label for="checkbox-all-search" class="sr-only">checkbox</label>
									</div>
								</th>
								<th scope="col" class="px-6 py-3" rowspan="2"> First name </th>
								<th scope="col" class="px-6 py-3" rowspan="2"> Last name </th>
								<th scope="col" class="px-6 py-3" rowspan="2"> Email </th>
								<th scope="col" class="px-6 py-3"> Instruments </th>
							</tr>
							<tr>
								<th>
									<table class="w-full table-fixed opacity-70">
										<thead>
											<tr>
												<th scope="col" class="px-6 py-3"> Name </th>
												<th scope="col" class="px-6 py-3"> Proficiency level </th>
												<th scope="col" class="px-6 py-3"> Family </th>
											</tr>
										</thead>
									</table>
								</th>
							</tr>
						</thead>
						<tbody>
							{#each contacts as contact}
								<tr
									class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
								>
									<td class="w-4 p-4">
										<div class="flex items-center">
											<input
												id="checkbox-table-search-1"
												type="checkbox"
												class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
												bind:checked={contact.checked}
											/>
											<label for="checkbox-table-search-1" class="sr-only">checkbox</label>
										</div>
									</td>
									<th
										scope="row"
										class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
									>
										{contact.firstName}
									</th>
									<td class="px-6 py-4">
										{contact.lastName}
									</td>
									<td class="px-6 py-4">
										{contact.email}
									</td>
									{#if contact.instruments.length}
										{#each contact.instruments as instrument}
											<table class="w-full table-fixed">
												<tr class="w-full">
													<td class="px-6 py-4"> {instrument.name} </td>
													<td class="px-6 py-4"> {instrument.pivot_proficiency_level} </td>
													<td class="px-6 py-4"> {instrument.family} </td>
												</tr>
											</table>
										{/each}
									{/if}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</SimpleFilterer>
		{/if}
	</div>
</div>
