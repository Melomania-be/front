<script lang="ts">
	import { onMount } from 'svelte';

	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { Contact } from '$lib/types/Contact';
	import type { List } from '$lib/types/List';
	import AdvancedFilterer from '$lib/components/AdvancedFilterer.svelte';
	import Fa from 'svelte-fa';
	import { faSliders, faTrashCan, faUser, faXmark } from '@fortawesome/free-solid-svg-icons';
	import {
		familyToEmoji,
		familyToStyle,
		levelSimplificator,
		levelToStyle
	} from '$lib/components/contact/StylesFunctions';
	import type { Instrument } from '$lib/types/Instrument';

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
		filters: {
			type: 'and',
			filtersDepth1: [
				{ type: 'or', filtersDepth2: [] },
				{ type: 'or', filtersDepth2: [] },
				{ type: 'or', filtersDepth2: [] },
				{ type: 'or', filtersDepth2: [] }
			]
		},
		page: 1,
		limit: 250,
		orderBy: 'id',
		order: 'asc'
	};

	let columns: any;
	let filterLevel: string[] = [];

	let dataHolder: TableData<Contact & { checked: boolean }>;

	let contactsToDisplay: (Contact & { checked: boolean })[] = [];

	onMount(async () => {
		fetchData();
	});

	async function fetchData() {
		let response = await fetch('/test/api', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(options)
		});

		const responseHandler = new ResponseHandlerClient();

		await responseHandler.handle(response, async () => {
			const jsonResponse = await response.json();

			contacts = jsonResponse.data.data.map((contact: Contact) => {
				return {
					...contact,
					checked: false
				};
			});
			meta = jsonResponse.data.meta;
			columns = jsonResponse.columns;
			contactsToDisplay = contacts;

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

			await responseHandler.handle(response2, async () => {
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
		const checkedContacts = contacts.filter((contact) => contact.checked);
		
		if (checkedContacts.length === 0) return;

		const skipped: (Contact & { checked: boolean })[] = [];
		const toAdd: Contact[] = [];

		checkedContacts.forEach((contact) => {
			const exists = newList.contacts.find((c) => c.id === contact.id);
			if (exists) {
				skipped.push(contact);
			} else {
				const { checked, ...rest } = contact;
				toAdd.push(rest);
			}
		});

		if (toAdd.length > 0) {
			newList.contacts = [...newList.contacts, ...toAdd];
		}

		if (skipped.length > 0) {
			const names = skipped.map(c => `${c.firstName} ${c.lastName}`).join('\n- ');
			alert(`The following contact(s) were not added because they are already in the list:\n- ${names}`);
		}
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

		await responseHandler.handle(response, async () => {
			goto('/contacts/lists');
		});
	}

	async function deleteList() {
		const response = await fetch(`/api/lists/${newList.id}`, {
			method: 'DELETE'
		});

		const responseHandler = new ResponseHandlerClient();

		await responseHandler.handle(response, async () => {
			goto('/contacts/lists');
		});
	}

	let showInstruments = true;

	let isMobile = false;

	const checkMobile = () => {
		isMobile = window.innerWidth <= 1000;
	};

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});
</script>

<div class="bg-[#E7E7E7]">
	<div class="m-4 col-span-2 border-2 border-gray-500 rounded-xl p-4 bg-white">
		<div class="flex items-center">
			<h2 class="text-xl uppercase font-bold text-gray-600">List</h2>
			<div class="ml-auto">
				<button
					class=" bg-[#6b9ad9] hover:bg-[#5b89c5] text-white font-semibold px-3 p-2 rounded-lg"
					on:click={save}>Save</button
				>
				{#if mode === 'modify'}
					<button
						class="m-2 bg-red-400 rounded-lg px-3 p-2 text-white font-semibold"
						on:click={deleteList}>Delete</button
					>
				{/if}
			</div>
		</div>
		<div class="flex items-center">
			<h2 class="">List name :</h2>
			<input
				class="m-1 border-2 rounded-lg px-2"
				bind:value={newList.name}
				placeholder="List name"
			/>
		</div>
		<h2 class="text-xl font-bold mt-4 mb-2 text-gray-600 uppercase">Contacts</h2>
		{#if newList.contacts.length > 0}
			<div class="relative overflow-x-auto shadow-md sm:rounded-lg w-full mt-2 border border-gray-300">
				<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
					<thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 border-b">
						<tr>
							<th scope="col" class="px-6 py-3"> First name </th>
							<th scope="col" class="px-6 py-3"> Last name </th>
							<th scope="col" class="px-6 py-3"> Email </th>
							{#if showInstruments}
								<th scope="col" class="px-6 py-3"> Instruments </th>
							{/if}
							<th scope="col" class="px-6 py-3 text-right"> Actions </th>
						</tr>
					</thead>
					<tbody>
						{#each newList.contacts as contact}
							<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
								<td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
									{contact.firstName}
								</td>
								<td class="px-6 py-4">
									{contact.lastName}
								</td>
								<td class="px-6 py-4">
									{contact.email || ''}
								</td>
								{#if showInstruments}
									<td class="px-6 py-4">
										{#if contact.instruments && contact.instruments.length}
											<div class="flex flex-wrap gap-2">
												{#each contact.instruments as instrument}
													<div class="flex gap-2 items-center my-1">
														<div class="{familyToStyle(instrument.family)} font-semibold rounded-lg p-1 px-2 text-xs">
															{familyToEmoji(instrument.family)}
															{instrument.name}
														</div>
														{#if instrument.pivot_proficiency_level}
															<div class="{levelToStyle(instrument.pivot_proficiency_level)} border-2 p-1 px-2 rounded-lg font-semibold text-xs">
																{levelSimplificator(instrument.pivot_proficiency_level)}
															</div>
														{/if}
													</div>
												{/each}
											</div>
										{/if}
									</td>
								{/if}
								<td class="px-6 py-4 text-right">
									<button
										class="p-2 bg-red-400 hover:bg-red-500 rounded-lg inline-flex items-center justify-center"
										on:click={() => {
											newList.contacts = newList.contacts.filter((c) => c.id !== contact.id);
										}}
									>
										<Fa icon={faTrashCan} style="color: white;" />
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
	<div class="col-span-4 border-2 border-gray-500 rounded-xl p-4 bg-white m-4">
		{#if dataHolder}
			<div class="flex w-full mb-2">
				<button
					class="m-2 text-white bg-[#6b9ad9] hover:bg-[#5b89c5] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
					on:click={addToList}>Add to List</button
				>
			</div>

			<AdvancedFilterer
				bind:columns
				bind:meta
				bind:data={dataHolder}
				bind:options
				bind:filterLevel
				uniqueUrl={'/contacts'}
				on:optionsUpdated={() => fetchData()}
			>
				<div class="relative overflow-x-auto shadow-md sm:rounded-lg w-full mt-2">
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
						</thead>
						<tbody>
							{#each contactsToDisplay as contact}
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
									<td>
										{#if contact.instruments.length}
											{#each contact.instruments as instrument}
												<div class="flex gap-4 my-1 pl-6">
													<div
														class="{familyToStyle(
															instrument.family
														)} font-semibold rounded-lg p-1 px-2"
													>
														{familyToEmoji(instrument.family)}
														{instrument.name}
													</div>
													{#if instrument.pivot_proficiency_level}
														<div
															class="{levelToStyle(
																instrument.pivot_proficiency_level
															)} border-2 p-1 px-2 rounded-lg font-semibold"
														>
															{levelSimplificator(instrument.pivot_proficiency_level)}
														</div>
													{/if}
												</div>
											{/each}
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</AdvancedFilterer>
		{/if}
	</div>
</div>
