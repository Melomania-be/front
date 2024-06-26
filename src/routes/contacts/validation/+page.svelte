<script lang="ts">
	import { onMount } from 'svelte';
	import Fa from 'svelte-fa';
	import {
		faArrowLeft,
		faMagnifyingGlass,
		faCheck,
		faXmark,
	} from '@fortawesome/free-solid-svg-icons';

	type Instrument = {
		id: number | null;
		name: string;
		family: string;
		createdAt: Date | null;
		updatedAt: Date | null;
	};

	type Contacts = {
		id: number;
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		messenger: string;
		comments: string;
		validated: boolean;
		instruments: Array<Instrument>;
		proficiency_level: string;
		recommendation_pending: Boolean;
		created_at: Date;
		last_update: Date;
		[key: string]: any;
	};

	let listContacts: Array<Contacts> = [];
	let allContacts: Array<Contacts> = [];
	let selectedContact: Contacts | null = null;
	let similartoSelected: Array<Contacts> = [];
	let comparedContact: Contacts | null = null;
	let filteredContacts: Array<Contacts> = [];
	let search: string = '';
	let currentPage: number = 1;
	let selectedData:   {[key: string]: any} = {};

	//

	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import Filterer from '$lib/components/Filterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { CustomContact } from '$lib/types/CustomContact';
	import type { Contact } from '$lib/types/Contact';
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 10,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};
	let url: string = '/api/contacts';
	let urlFront: string = '/contacts/validation';
	let uniqueUrl: string = '/contacts';
	let contacts: CustomContact[] = [];
	let dataHolder: TableData<CustomContact>;


	onMount(async () => {
		try {
			const res = await fetch('/api/contacts/validations', { method: 'GET' });
			if (res.ok) {
				const contacts = await res.json();
				listContacts = contacts.map((contact: any) => ({
					id: contact.id,
					firstName: contact.firstName,
					lastName: contact.lastName,
					email: contact.email,
					phone: contact.phone,
					messenger: contact.messenger,
					comments: contact.comments,
					validated: contact.validated_contact,
					instruments: contact.instruments,
					proficiency_level: contact.proficiency_level,
					recommendation_pending: contact.recommendation_pending,
					created_at: new Date(contact.created_at),
					last_update: new Date(contact.last_update)
				}));
			} else {
				console.error('Failed to fetch contacts waiting for validation, status:', res.status);
			}
		} catch (error) {
			console.error('Error fetching contacts waiting for validation:', error);
		}

		const urlParams = new URLSearchParams(window.location.search);
		options = {
			filter: urlParams.get('filter') || '',
			limit: parseInt(urlParams.get('limit') || '1'),
			page: parseInt(urlParams.get('page') || '1'),
			order: urlParams.get('order') || 'asc',
			orderBy: urlParams.get('orderBy') || 'id'
		};

		fetchData();

		try {
			const resAll = await fetch('/api/contacts', { method: 'GET' });
			if (resAll.ok) {
				const contactsAll = await resAll.json();
				allContacts = contactsAll.map((contact: any) => ({
					id: contact.id,
					firstName: contact.firstName,
					lastName: contact.lastName,
					email: contact.email,
					phone: contact.phone,
					messenger: contact.messenger,
					comments: contact.comments,
					validated: contact.validated_contact,
					instruments: contact.instruments,
					proficiency_level: contact.proficiency_level,
					recommendation_pending: contact.recommendation_pending,
					created_at: new Date(contact.created_at),
					last_update: new Date(contact.last_update)
				}));
				filteredContacts = [...allContacts];
				console.log('All contacts:', allContacts);
			} else {
				console.error('Failed to fetch all contacts, status:', resAll.status);
			}
		} catch (error) {
			console.error('Error fetching all contacts:', error);
		}
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


	function selectContact(contact: Contacts) {
		selectedContact = contact;
		similartoSelected = [];

		for (let i = 0; i < allContacts.length; i++) {
			if (allContacts[i].id != selectedContact.id) {
				if (
					allContacts[i].firstName === selectedContact.firstName ||
					allContacts[i].lastName === selectedContact.lastName ||
					allContacts[i].email === selectedContact.email
				) {
					similartoSelected.push(allContacts[i]);
				}
			}
		}
	}

	function selectedCompared(contact: Contacts) {
		comparedContact = contact;
	}

	function deselectContact() {
		selectedContact = null;
		similartoSelected = [];
		comparedContact = null;
	}

	function deselectCompared() {
		comparedContact = null;
	}

	/*
	function searchContacts(query: string) {
		filteredContacts = allContacts.filter((contact) => {
			const fullName = `${contact.firstName} ${contact.lastName}`;
			return fullName.toLowerCase().includes(query.toLowerCase());
		});
	}
	*/

	function checkboxChange(field: string, contact: Contacts | null, event: Event) {
		if (contact === null) return;
		const checked = (event.target as HTMLInputElement).checked;
		if (checked) {
			selectedData[field] = contact[field];
		} else {
			delete selectedData[field];
		}

		console.log('Selected data:', selectedData);
	}

	function submitMerged(data: {[key: string]: any}) {
		if (
			data.firstName &&
			data.lastName &&
			data.email &&
			data.phone &&
			data.messenger &&
			data.comments &&
			data.instruments &&
			data.proficiency_level
		) {
			console.log('OKKKKKKK');
		} else {
			console.log('Need more data to do anything.');
			alert('Please check one box for each field to merge 2 contacts.')
		}
		console.log('Merged data:', data);

		fetch(`/api/contacts/`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		})
			.then((res) => {
				if (res.ok) {
					console.log('Contact updated');
				} else {
					console.error('Failed to update contact, status:', res.status);
				}
			})
			.catch((error) => {
				console.error('Error updating contact:', error);
			});
	}

	function deletion(id: number) {

		if (id === -1) {
			console.error('Cannot delete contact, id unknown.');
			return;
		}
		fetch(`/api/contacts/${id}`, { method: 'DELETE' })
			.then((res) => {
				if (res.ok) {
					console.log('Contact deleted');
					listContacts = listContacts.filter((contact) => contact.id !== id);
				} else {
					console.error('Failed to delete contact, status:', res.status);
				}
			})
			.catch((error) => {
				console.error('Error deleting contact:', error);
			});

		alert(
			`The contact "${selectedContact?.firstName} ${selectedContact?.lastName}" waiting for validation has been successfully deleted`
		);

		filteredContacts = filteredContacts.filter((contact) => contact.id !== selectedContact?.id);
		listContacts = listContacts.filter((contact) => contact.id !== selectedContact?.id);

		deselectContact();
	}

	async function validateContact(id: number){
		
		if (id === -1){
			console.error('Cannot validate contact, id unknown.');
			return;
		}

		let data = {
			id: id,
			first_name: selectedContact?.firstName || '',
			last_name: selectedContact?.lastName || '',
			email: selectedContact?.email || '',
			phone: selectedContact?.phone || '',
			messenger: selectedContact?.messenger || '',
			comments: selectedContact?.comments || '',
			validated: true,
			instruments: selectedContact?.instruments || [],
			proficiency_level: selectedContact?.proficiency_level || '',
			recommendation_pending: selectedContact?.recommendation_pending || false,
			created_at: selectedContact?.created_at || new Date(),
			last_update: new Date()
		}

		console.log('Data to send:', data);

		const response = await fetch(`/api/contacts`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});

		const responseText = await response.text();
		console.log('Server response:', responseText);

		if (response.status >= 400 && response.status < 500) {
			const jsonResponse = JSON.parse(responseText);
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		} else if (response.status >= 500) {
			alert('Server error');
		}

		if (response.ok) {
			alert(
				`The contact "${selectedContact?.firstName} ${selectedContact?.lastName}" has been successfully validated`
			);

			filteredContacts = filteredContacts.filter((contact) => contact.id !== selectedContact?.id);
			listContacts = listContacts.filter((contact) => contact.id !== selectedContact?.id);
			deselectContact();
		}
	}
</script>

<main class="grid grid-cols-3 gap-4 ml-5 mr-5">
	<div class="col-1 border-2 border-rose-500">
		{#if selectedContact}
			<div>
				<div class="flex items-center cursor-pointer" on:click={() => deselectContact()}>
					<Fa icon={faArrowLeft} />
					<b><span>&#20; Back to pending validations</span></b>
				</div>
				Selected contact:
				<br />
				<ul>
					<li>first name : {selectedContact.firstName}</li>
					<li>last name : {selectedContact.lastName}</li>
					<li>email : {selectedContact.email}</li>
					<li>phone : {selectedContact.phone}</li>
					<li>messenger : {selectedContact.messenger}</li>
					<li>comments : {selectedContact.comments}</li>
					<li>instruments : {selectedContact.instruments}</li>
					<li>proficiency_level : {selectedContact.proficiency_level}</li>
				</ul>
			</div>
			<div class="flex items-center justify-center">
				<button
					type="button"
					class="bg-green-500 text-sm px-2 py-1 mr-2 rounded-lg text-white hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300"
					on:click={() => validateContact(selectedContact?.id || -1)}
					>
					<span>ADD CONTACT</span>
				</button>
				<button
					type="button"
					class="bg-red-500 text-sm px-2 py-1 mr-2 rounded-lg text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300"
					on:click={() => deletion(selectedContact?.id || -1)}
				>
					<span>SUPRESSION</span>
				</button>
			</div>
		{:else}
			<h1>Contacts to validate</h1>
			<h2>No contact selected</h2>
			To display more informations please select a contact.<br />

			{#if listContacts}
				<br />
				{#each listContacts as contact}
					<div
						class="border-b-2 border-gray-300 flex justify-between items-center"
						on:click={() => selectContact(contact)}
					>
						{contact.firstName}
						{contact.lastName} - {contact.email}
					</div>
				{/each}
			{/if}
		{/if}
	</div>

	{#if selectedContact && comparedContact}
		<div class="border-2 border-pink-500 col-1 mx-auto">
			<table>
				<thead>
					<tr>
						<th>Field</th>
						<th>Comparison</th>
						<th>Contact 1</th>
						<th>Contact 2</th>
					</tr>
				</thead>
				<tbody>
					{#if selectedContact && comparedContact}
						{#each Object.entries(selectedContact) as [key, value]}
							{#if key !== 'id' && key !== 'created_at' && key !== 'last_update' && key !== 'validated' && key !== 'recommendation_pending'}
								<tr>
									<td>{key}</td>
									{#if selectedContact[key] === comparedContact[key]}
										<td><Fa icon={faCheck} /></td>
									{:else}
										<td><Fa icon={faXmark} /></td>
									{/if}
									<td>
										<input
											type="checkbox"
											checked={selectedData[key] === selectedContact[key]}
											on:change={(event) => checkboxChange(key, selectedContact, event)}
										/>
									</td>
									<td>
										<input
											type="checkbox"
											checked={selectedData[key] === comparedContact[key]}
											on:change={(event) => checkboxChange(key, comparedContact, event)}
										/>
									</td>
								</tr>
							{/if}
						{/each}
					{/if}
				</tbody>
			</table>
			<br>

			<div class="flex justify-center">
				<button
					type="button"
					class="bg-blue-400 text-sm px-2 py-1 mr-2 rounded-lg text-white hover:bg-blue-500 focus:outline-none"
					on:click={() => submitMerged(selectedData)}
				>
					<span>MERGE</span>
				</button>
			</div>
		</div>	
	{:else}
		<div class="border-2 border-pink-500 col-1 w-1/2 mx-auto">
			<p>Select two contacts to compare and merge.</p>
		</div>
	{/if}

	{#if selectedContact}
		{#if comparedContact === null}
			<div class="col-1 border-2 border-green-500">
				<div class="border-2 border-pink-500">
					<h2>Recommended</h2>
					The following contacts are similar to the selected contact:
					{#if similartoSelected}
						{#each similartoSelected as contact}
							<div class="border-b-2 border-gray-300 flex justify-between items-center">
								<div
									class="flex border-2 border-rose-500 cursor-pointer"
									on:click={() => selectedCompared(contact)}
								>
									{contact.firstName}
									{contact.lastName} - {contact.email}
								</div>
								<button
									type="button"
									class="bg-blue-500 text-sm px-2 py-1 mr-2 rounded-lg text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
									on:click={() => (window.location.href = `${contact.id}`)}
								>
									<Fa icon={faMagnifyingGlass} /> <span>Info</span>
								</button>
							</div>
						{/each}
					{/if}
				</div>

				<div class="border-2 border-yellow-500">
					<h2><b>All Contacts</b></h2>
					<!--
					{#if allContacts}
						<input
							type="text"
							placeholder="Search contacts"
							class="border border-gray-300 rounded-lg px-2 py-1"
							bind:value={search}
							on:input={() => searchContacts(search)}
						/>

						{#each filteredContacts.filter((contact) => contact.id !== selectedContact?.id) as contact, i (contact.id)}
							{#if i >= (currentPage - 1) * 5 && i < currentPage * 5}
								<div class="border-b-2 border-gray-300 flex justify-between items-center">
									<div class="flex cursor-pointer" on:click={() => selectedCompared(contact)}>
										{contact.firstName}
										{contact.lastName} - {contact.email}
									</div>
									<button
										type="button"
										class="bg-blue-500 text-sm px-2 py-1 mr-2 rounded-lg text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
										on:click={() => (window.location.href = `${contact.id}`)}
									>
										<Fa icon={faMagnifyingGlass} /> <span>Info</span>
									</button>
								</div>
								{#if currentPage !== 1}
									<button
										type="button"
										class="bg-blue-500 text-sm px-2 py-1 mr-2 rounded-lg text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
										on:click={() => (currentPage -= 1)}
									>
										Previous
									</button>
								{/if}
								<button
									type="button"
									class="bg-blue-500 text-sm px-2 py-1 mr-2 rounded-lg text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
									on:click={() => (currentPage += 1)}
								>
									Next
								</button>
							{/if}
						{/each}
					{/if}
				-->
				{#if dataHolder}
					<Filterer showData={true} bind:data={dataHolder} bind:meta bind:options bind:uniqueUrl on:optionsUpdated={()=>fetchData()}></Filterer>
				{/if}
				</div>
			</div>
		{:else}
			<div class="border-2 border-rose-500">
				<div class="flex items-center cursor-pointer" on:click={() => deselectCompared()}>
					<Fa icon={faArrowLeft} />
					<b><span>&#20; Back to comparison selector</span></b>
				</div>
				Selected contact:
				<br />
				{comparedContact.firstName}
				{comparedContact.lastName}
				<br />
				<ul>
					<li>email : {comparedContact.email}</li>
					<li>phone : {comparedContact.phone}</li>
					<li>messenger : {comparedContact.messenger}</li>
					<li>comments : {comparedContact.comments}</li>
					<li>proficiency_level : {comparedContact.proficiency_level}</li>
					<li>
						<span>instruments :</span>
							{#if comparedContact.instruments !== null}
								{#each comparedContact.instruments as instrument}
									<option value={instrument}> - {instrument.name}</option>	
								{/each}
							{/if}
					</li>
				</ul>
			</div>
		{/if}
	{:else}
		<div class="flex border-2 border-green-500">
			<h2>No contact selected</h2>
		</div>
	{/if}
</main>
