<script lang="ts">
	import { onMount } from 'svelte';

	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { Contact } from '$lib/types/Contact';
	import type { List } from '$lib/types/List';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
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
		filter: '',
		limit: 250,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};

	let dataHolder: TableData<Contact & { checked: boolean }>;

	let contactsToDisplay: (Contact & { checked: boolean })[] = [];

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
			contactsToDisplay = contacts

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

	let showInstruments = false;

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

	let popUpFilter = false;

	let instruments: Instrument[] = [];
	let instrumentFamily: string[];
	let selectedInstrumentIds: Set<number> = new Set();
	let selectedFamilyIds: Set<string> = new Set();
	

	onMount(async () => {
		// Puis récupérer les instruments via fetch
		fetchInstruments().then((data) => {
			instruments = data;
		});
		

	});
	

	async function fetchInstruments() {
		try {
			const response = await fetch('/api/instruments');

			if (!response.ok) {
				throw new Error(`Erreur ${response.status} : ${response.statusText}`);
			}

			const instruments : Instrument[] = await response.json();
			console.log(instruments)
			instrumentFamily = [...new Set(instruments.map(i => i.family))];
			return instruments;
		} catch (error) {
			console.error('Erreur lors de la récupération des instruments :', error);
			return [];
		}
	}

	function toggleInstrumentFilter(id: number, checked: boolean) {
		if (checked) {
			selectedInstrumentIds = new Set(selectedInstrumentIds.add(id))
		} else {
			selectedInstrumentIds.delete(id)
   			selectedInstrumentIds = new Set(selectedInstrumentIds)
		}

		if(selectedInstrumentIds.size == 0){
			contactsToDisplay = contacts
		}
		else{
			contactsToDisplay = contacts.filter((contact) => contact.instruments.some((instrument) => selectedInstrumentIds.has(instrument.id)))
		}
	}

	function resetFilter(){
		console.log(contacts)
		selectedInstrumentIds = new Set();
		selectedFamilyIds = new Set();
		selectedLevelInstruments = new Map();
		contactsToDisplay = contacts;
	}

	
	const levels = [
		'Amateur - low level',
		'Amateur - medium',
		"Amateur - high",
		"Student",
		"Professional",
		"High level professional"
	]

	let selectedLevelInstruments: Map<number , string> = new Map();

	function handleLevelChange(instrumentId: number, level: string) {
		if (level) {
			selectedLevelInstruments.set(instrumentId , level)
			console.log(selectedLevelInstruments)
		}
		console.log(contactsToDisplay)
		contactsToDisplay = contactsToDisplay.filter(c => c.instruments.some(i => selectedLevelInstruments.has(i.id) && i.pivot_proficiency_level == selectedLevelInstruments.get(i.id) ))
	}

	function updateFamilyFilter(family : string, checked: boolean) {
		if (checked) {
			selectedFamilyIds = new Set(selectedFamilyIds.add(family));
		} else {
			selectedFamilyIds.delete(family);
			selectedFamilyIds = new Set(selectedFamilyIds)
		}
		console.log(selectedFamilyIds)

		if(selectedFamilyIds.size == 0){
			contactsToDisplay = contacts
		}
		else{
			contactsToDisplay = contacts.filter((contact) => contact.instruments.some((instrument) => selectedFamilyIds.has(instrument.family)))
		}
	}
	
</script>

{#if popUpFilter}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 {isMobile
			? ''
			: 'pl-64'} "
	>
		<div
			class="bg-white pb-4 rounded-xl shadow-xl h-[50%] text-gray-600 {isMobile
				? 'w-[90%]'
				: 'w-[60%]'}"
		>
			<div class="flex items-center">
				<h2 class="text-xl font-bold my-4 ml-6 uppercase text-gray-400">Filter</h2>
				<button
					class="ml-auto mr-6"
					on:click={() => {
						popUpFilter = false;
						document.body.style.overflow = '';
					}}><Fa icon={faXmark} class="text-[22px]" style="color: #6b7280;" /></button
				>
			</div>
			<div class="px-6 h-[80%] w-auto overflow-y-auto">
				<h2 class="text-md font-bold mb-4 text-xl">Instruments</h2>
				<div class="grid  mb-6  {isMobile ? "grid-cols-[1fr_1fr]" : "grid-cols-[1fr_1fr_1fr] px-4"}">
					{#each instruments as instrument}
						<div class="flex gap-2 h-8 items-center">
							<input
								id={String(instrument.id)}
								checked={selectedInstrumentIds.has(instrument.id)}
								type="checkbox"
								class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
								on:change={(e) => toggleInstrumentFilter(instrument.id, e.target.checked)}
							/>
							<p>{instrument.name}</p>
							{#if selectedInstrumentIds.has(instrument.id)}
								<select class="border-2 rounded-lg border-gray-400"
									on:change={(e) => handleLevelChange(instrument.id, e.target.value)}
									value={selectedLevelInstruments.get(instrument.id)}>
									<option class="" value={null}>none</option>
									{#each levels as level}
										<option class="{levelToStyle(level)}" value={level}>{levelSimplificator(level)}</option>
									{/each}
								</select>
							{/if}
						</div>
					{/each}
				</div>
				<h2 class="text-md font-bold mb-2 text-xl">Family</h2>
				<div class="grid gap-2 mb-6 {isMobile ? "grid-cols-[1fr_1fr]" : "grid-cols-[1fr_1fr_1fr] px-4"}">
					{#each instrumentFamily as family}
					<div class="flex items-center gap-2">
							<input
								id={family}
								checked={selectedFamilyIds.has(family)}
								type="checkbox"
								class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
								on:change={(e) => updateFamilyFilter(family , e.target.checked)}
							/>
							<p class="{familyToStyle(family)} font-semibold rounded-lg p-1 px-2"> {familyToEmoji(family)} {family}</p>
					</div>
					{/each}
				</div>
			</div>
			<div class="flex pr-6 bg-white border-t py-2 rounded-b-xl border-gray-300">
				<button
					class="w-[20%] px-4 py-2 my-2 rounded-full hover:underline font-semibold"
					on:click={() => {
						popUpFilter = false;
						document.body.style.overflow = '';
						resetFilter() ;
					}}>Reset Filter</button
				>
				<button
					on:click={() => { popUpFilter = false; document.body.style.overflow = '';}}
					class=" {isMobile ? "w-[40%]" : "w-[30%] px-4 py-2"} my-2 ml-auto bg-[#6b9ad9] hover:bg-[#5b89c5] text-white rounded-full font-bold"
				>
					Search
				</button>
			</div>
		</div>

	</div>
{/if}

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
		<div class="flex gap-2 items-center mb-4">
			<input
				bind:checked={showInstruments}
				type="checkbox"
				class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
			/>
			<span> Show Instruments</span>
		</div>
		{#if newList.contacts.length > 0}
			<div class="grid {isMobile ? "" : "grid-cols-3"} gap-4">
				{#each newList.contacts as contact}
					<div>
						<div class="border-2 border-gray-400 rounded-xl p-4 h-auto flex items-center">
							<div>
								<div class="flex gap-4 font-bold items-center">
									<Fa icon={faUser} class="text-[18px]" style="color: #6b9ad9;" />
									<p>{contact.firstName} {contact.lastName}</p>
								</div>
								{#if showInstruments}
									{#each contact.instruments as instrument}
										<div class="flex gap-4 my-1">
											<div
												class="{familyToStyle(instrument.family)} font-semibold rounded-lg p-1 px-2"
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
							</div>
							<div class="ml-auto">
								<button
									class="p-2 bg-red-400 rounded-lg ml-auto"
									on:click={() => {
										newList.contacts = newList.contacts.filter((c) => c.id !== contact.id);
									}}
								>
									<Fa icon={faTrashCan} class="text-[16px]" style="color: white;" />
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
	<div class="col-span-4 border-2 border-gray-500 rounded-xl p-4 bg-white m-4">
		{#if dataHolder}
			{#if !isMobile}
			<div class="flex w-full">
			<button
				class="m-2 text-white bg-[#6b9ad9] hover:bg-[#5b89c5] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				on:click={addToList}>Add to List</button
			>
			<div class="flex gap-2 ml-auto">
				{#if instrumentFamily.length !== 0 }
						<p class="flex gap-2 text-sm font-semibold text-[#6b7280] items-center	">Legend : 
							{#each instrumentFamily as family}
								<div class="p-1 px-2 rounded-lg {familyToStyle(family)}"> {familyToEmoji(family)} {family} </div> 
							{/each}
						</p>
				{/if}
			</div>
			</div>
			{:else}
					<div class="grid grid-cols-2 gap-2 text-sm font-semibold text-[#6b7280] items-center">
						{#each instrumentFamily as family}
							<div class="p-1 px-2 rounded-lg {familyToStyle(family)}"> {familyToEmoji(family)} {family} </div> 
						{/each}
					</div>
					<button
					class="m-2 mt-6 text-white bg-[#6b9ad9] hover:bg-[#5b89c5] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
					on:click={addToList}>Add to List</button
				>
			{/if}
			<SimpleFilterer
				bind:data={dataHolder}
				bind:meta
				bind:options
				on:optionsUpdated={() => fetchData()}
			>
			<div class="w-full py-2">
				<button
					on:click={() => {
						popUpFilter = true;
						document.body.style.overflow = 'hidden';
					}}
					class="flex items-center border-2 border-gray-400 p-1 gap-2 rounded-full px-4"
				>
					<p class="text-gray-500 font-semibold">Filter</p>
					<Fa icon={faSliders} class="text-[16px]" style="color: #6b7280;" />
				</button>
				</div>
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
													<div
														class="{levelToStyle(
															instrument.pivot_proficiency_level
														)} border-2 p-1 px-2 rounded-lg font-semibold"
													>
														{levelSimplificator(instrument.pivot_proficiency_level)}
													</div>
												</div>
											{/each}
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</SimpleFilterer>
		{/if}
	</div>
</div>
