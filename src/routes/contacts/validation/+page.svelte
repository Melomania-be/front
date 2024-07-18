<script lang="ts">
	import { onMount } from 'svelte';
	import Fa from 'svelte-fa';
	import {
		faArrowLeft,
		faMagnifyingGlass,
		faCheck,
		faXmark
	} from '@fortawesome/free-solid-svg-icons';

	type Instrument = {
		pivot_proficiency_level: string;
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
		recommendation_pending: Boolean;
		[key: string]: any;
	};

	let notValidatedContacts: Array<Contacts> = [];
	let allContacts: Array<Contacts> = [];
	let selectedContact: Contacts | null = null;
	let similartoSelected: Array<Contacts> = [];
	let comparedContact: Contacts | null = null;
	let filteredContacts: Array<Contacts> = [];
	let selectedData: { [key: string]: any } = {};
	let instrumentsComp: boolean = false;
	//

	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { Contact } from '$lib/types/Contact';
	import { updated } from '$app/stores';
	import type { Project } from '$lib/types/Project';
	import type { Callsheet } from '$lib/types/Callsheet';
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
	let contacts: Contact[] = [];
	let dataHolder: TableData<Contact>;

	onMount(async () => {
		try {
			const resAll = await fetch('/api/contacts/validations', { method: 'GET' });
			if (resAll.ok) {
				const contactsAll = await resAll.json();
				console.log('All Contacts:', contactsAll);
				allContacts = contactsAll.map((contact: any) => ({
					id: contact.id,
					firstName: contact.firstName,
					lastName: contact.lastName,
					email: contact.email,
					phone: contact.phone,
					messenger: contact.messenger,
					comments: contact.comments,
					validated: contact.validated,
					instruments:
						contact.instruments.map((instrument: any) => ({
							created_at: instrument.created_at,
							id: instrument.id,
							name: instrument.name,
							family: instrument.family,
							pivot_proficiency_level: instrument.pivot_proficiency_level,
							updated_at: instrument.updated_at
						})) || [],
					recommendation_pending: contact.recommendation_pending,
					created_at: new Date(contact.created_at),
					last_update: new Date(contact.last_update)
				}));

				notValidatedContacts = allContacts.filter((contact) => !contact.validated);

				console.log('Not validated contacts:', notValidatedContacts);
			} else {
				console.error('Failed to fetch all contacts, status:', resAll.status);
			}
		} catch (error) {
			console.error('Error fetching every contacts:', error);
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

			contacts = data.data;
			meta = data.meta;

			dataHolder = {
				data: contacts,
				columns: ['id', 'firstName', 'lastName'],
				notOrderedColumns: []
			};
		});
	}

	function selectContact(contact: Contacts) {
		selectedContact = contact;
		similartoSelected = allContacts.filter(
			(contact) =>
				(contact.firstName === selectedContact?.firstName ||
					contact.lastName === selectedContact?.lastName ||
					contact.email === selectedContact?.email) &&
				contact.id !== selectedContact?.id
		);
		console.log('Selected:', contact);
	}

	function selectedCompared(contact: Contacts) {
		console.log('Selected compared:', contact);
		comparedContact = contact;

		if (comparedContact?.instruments.length > 0 && selectedContact?.instruments.length > 0) {
			for (let i = 0; i < selectedContact?.instruments.length; i++) {
				if (
					selectedContact?.instruments[i].id === comparedContact?.instruments[i].id &&
					selectedContact?.instruments[i].pivot_proficiency_level ===
						comparedContact?.instruments[i].pivot_proficiency_level
				) {
					instrumentsComp = true;
				} else {
					instrumentsComp = false;
				}
			}
		} else if (
			comparedContact?.instruments.length === 0 &&
			selectedContact?.instruments.length === 0
		) {
			instrumentsComp = true;
		} else {
			instrumentsComp = false;
		}
	}

	function deselectContact() {
		selectedContact = null;
		similartoSelected = [];
		comparedContact = null;
	}

	function deselectCompared() {
		comparedContact = null;
	}

	function checkboxChange(field: string, contact: Contacts | null, event: Event) {
		if (contact === null) return;
		const checked = (event.target as HTMLInputElement).checked;
		if (checked) {
			selectedData[field] = contact[field];
		} else {
			delete selectedData[field];
		}
	}

	async function submitMerged(data: { [key: string]: any }) {
		const requiredFields = [
			'firstName',
			'lastName',
			'email',
			'phone',
			'messenger',
			'comments',
			'instruments'
		];
		const missingFields = requiredFields.filter((field) => !data.hasOwnProperty(field));
		if (missingFields.length > 0) {
			`Missing required fields: ${missingFields.join(', ')}`;
			return;
		}

		let mergedContact = {
			id: comparedContact?.id || -1,
			first_name: data.firstName,
			last_name: data.lastName,
			email: data.email,
			phone: data.phone,
			messenger: data.messenger,
			comments: data.comments,
			validated: true,
			instruments: data.instruments,
			participant: comparedContact?.participant || [],
			proficiency_level: data.proficiency_level || '',
			recommendation_pending: false,
			created_at: comparedContact?.created_at || new Date(),
			last_update: new Date()
		};

		try {
			const res = await fetch(`/api/contacts/`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(mergedContact)
			});

			if (res.ok) {
				console.log('Contact updated');
				alert('Contact successfully updated');
				filteredContacts = filteredContacts.filter((contact) => contact.id !== comparedContact?.id);
				notValidatedContacts = notValidatedContacts.filter(
					(contact) => contact.id !== comparedContact?.id
				);
				deselectContact();
			} else {
				const responseText = await res.text();
				console.error('Failed to update contact, status:', res.status, 'Response:', responseText);
				alert(`Failed to update contact: ${responseText}`);
			}
		} catch (error) {
			console.error('Error updating contact:', error);
			alert('An error occurred while updating the contact.');
		}
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
					notValidatedContacts = notValidatedContacts.filter((contact) => contact.id !== id);
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
		notValidatedContacts = notValidatedContacts.filter(
			(contact) => contact.id !== selectedContact?.id
		);

		deselectContact();
	}

	async function validateContact(id: number) {
		if (id === -1) {
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
		};

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
			notValidatedContacts = notValidatedContacts.filter(
				(contact) => contact.id !== selectedContact?.id
			);
			deselectContact();
		}
	}
</script>

<main class="grid grid-cols-5 ml-5 mr-5">
	<div class="w-full col-span-2 border-2 border-rose-500">
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
					<li>
						<span>instruments :</span>
						{#if selectedContact.instruments !== null && selectedContact.instruments !== undefined}
							{#each selectedContact.instruments as instrument}
								<option value={instrument}>
									{instrument.name} - {instrument.pivot_proficiency_level}</option
								>
							{/each}
						{:else}
							No instrument found for this contact
						{/if}
					</li>
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

			{#if notValidatedContacts}
				<br />
				{#each notValidatedContacts as contact}
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
		<div class="w-full border-2 border-pink-500 col-span">
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
						{#each Object.entries(selectedContact) as [key]}
							{#if key !== 'id' && key !== 'created_at' && key !== 'last_update' && key !== 'validated' && key !== 'recommendation_pending' && key !== 'instruments'}
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
						<tr>
							<td>instruments</td>
							<td>
								{#if instrumentsComp === true}
									<Fa icon={faCheck} />
								{:else}
									<Fa icon={faXmark} />
								{/if}
							</td>
							<td>
								<input
									type="checkbox"
									checked={selectedData.instruments === selectedContact.instruments}
									on:change={(event) => checkboxChange('instruments', selectedContact, event)}
								/>
							</td>
							<td>
								<input
									type="checkbox"
									checked={selectedData.instruments === comparedContact.instruments}
									on:change={(event) => checkboxChange('instruments', comparedContact, event)}
								/>
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
			<br />

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
		<div class="w-full border-2 border-pink-500 col-1 w-1/2 mx-auto">
			<p>Select two contacts to compare and merge.</p>
		</div>
	{/if}

	{#if selectedContact}
		{#if comparedContact === null}
			<div class="w-full col-span-2 border-2 border-green-500">
				<div class="border-2 border-yellow-500">
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

					<h2><b>All Contacts</b></h2>
					{#if dataHolder}
						<SimpleFilterer
							showData={false}
							editable={false}
							paginatorTop={false}
							bind:data={dataHolder}
							bind:meta
							bind:options
							bind:uniqueUrl
							on:optionsUpdated={() => fetchData()}
						>
							<div class="border-2 border-blue-500">
								{#each contacts as contact}
									<div class="flex justify-between">
										<div class="flex cursor-pointer" on:click={() => selectedCompared(contact)}>
											{contact.firstName}
											{contact.lastName} - {contact.email}
										</div>
										<button
											type="button"
											class="bg-blue-500 text-sm px-2 py-1 mr-2 rounded-lg text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 justify-self-end"
											on:click={() => (window.location.href = `${contact.id}`)}
										>
											<Fa icon={faMagnifyingGlass} /> <span>Info</span>
										</button>
									</div>
								{/each}
							</div>
						</SimpleFilterer>
					{/if}
				</div>
			</div>
		{:else}
			<div class="w-full col-span-2 border-2 border-rose-500">
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
					<li>
						<span>instruments :</span>
						{#if comparedContact.instruments !== null}
							{#each comparedContact.instruments as instrument}
								<option value={instrument}>
									{instrument.name} - {instrument.pivot_proficiency_level}</option
								>
							{/each}
						{/if}
					</li>
				</ul>
			</div>
		{/if}
	{:else}
		<div class="w-full col-span-2 flex border-2 border-green-500">
			<h2>No contact selected</h2>
		</div>
	{/if}
</main>
