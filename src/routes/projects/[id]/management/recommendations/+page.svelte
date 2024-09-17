<script lang="ts">
	import { onMount } from 'svelte';

	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { Recommended } from '$lib/types/Recommended';
	import { page } from '$app/stores';
	import { Button, CloseButton, Drawer } from 'flowbite-svelte';
	import { sineIn } from 'svelte/easing';
	
	import Fa from 'svelte-fa';
	import { faPhone, faEnvelope, faCircleUser, faComment } from '@fortawesome/free-solid-svg-icons';
	import type { Instrument } from '$lib/types/Instrument';
	import type { Contact } from '$lib/types/Contact';
	import ContactModifier from '$lib/components/contact/ContactModifier.svelte';
	import DateShow from '$lib/components/DateShow.svelte';

    let recommended: Recommended[] = []
    let selectedData: Recommended = {
        id: null,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        messenger: '',
		instruments: [],
        comment: '',
        project_id: 0,
        createdAt: null,
        updatedAt: null,
    };

	let meta: any = {};
	let options: any = {
		filter: $page.params.id.toString(),
		limit: 250,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};
	let url: string = '/api/recommended';
	let urlFront: string = '/projects/' + $page.params.id + '/management/recommendations';
	let uniqueUrl: string = '/projects/' + $page.params.id + '/management/recommendations';


	let dataHolderRecommended: TableData<Recommended>;
	let dataHolderContact: TableData<Contact>;
	let metaContact: any = {};
	let columns: any;

	let optionsContacts: {
		filters: {
			type: string;
			filtersDepth1: {
				type: string;
				filtersDepth2: { relation: string; column: string; operation: string; filter: string }[];
			}[];
		};
		page: number;
		limit: number;
		orderBy: string;
		order: string;
	} = {
		filters: {
			type: 'and',
			filtersDepth1: [
				{
					type: 'or',
					filtersDepth2: []
				}
			]
		},
		page: 1,
		limit: 250,
		orderBy: 'id',
		order: 'asc'
	};
	
	let contacts: Contact[] = []

	let contact: Contact = {
		id: null,
		firstName: structuredClone(selectedData.firstName),
		lastName: structuredClone(selectedData.lastName),
		email: structuredClone(selectedData.email),
		phone: structuredClone(selectedData.phone),
		messenger: structuredClone(selectedData.messenger),
		comments: structuredClone(selectedData.comment),
		instruments: structuredClone(selectedData.instruments),
		participant: [],
		recommendation_pending: false,
		validated: false,
		createdAt: new Date(),
		updatedAt: new Date()
	};
	let instruments: Array<Instrument>;

    
    
    onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);
        options = {
            filter: urlParams.get('filter') || options.filter,
            limit: parseInt(urlParams.get('limit') || options.limit.toString()),
            page: parseInt(urlParams.get('page') || options.page.toString()),
            order: urlParams.get('order') || options.order,
            orderBy: urlParams.get('orderBy') || options.orderBy
        };

		
		let response = await fetch('/api/instruments', {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			instruments = await response.json();
		});

		fetchData();
	});

	const filter = {
		relation: '',
		column: '',
		operation: '',
		filter: ''
	};

	function addCondition(filterFilter: string, filterColum: string) {
		let tmpFilter = structuredClone(filter);
		tmpFilter.relation = 'self';
		tmpFilter.column = filterColum;
		tmpFilter.operation = '=';
		tmpFilter.filter = filterFilter;

		optionsContacts.filters.filtersDepth1[0].filtersDepth2.push(tmpFilter);
		optionsContacts = optionsContacts;
	}

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

			recommended = data.data

            meta = data.meta;

			dataHolderRecommended = {
				data: recommended,
				columns: ['id', 'firstName', 'lastName'],
				notOrderedColumns: []
			};
		});


		if (selectedData.firstName != ''){
			addCondition(selectedData.firstName, 'first_name')
		}
		if (selectedData.lastName != ''){
			addCondition(selectedData.lastName, 'last_name')
		}
		if (selectedData.email != ''){
			addCondition(selectedData.email, 'email')
		}
		if (selectedData.messenger != ''){
			addCondition(selectedData.messenger, 'messenger')
		}
		if (selectedData.phone != ''){
			addCondition(selectedData.phone, 'phone')
		}
		console.log(optionsContacts)

		let responseContacts = await fetch('/test/api', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(optionsContacts)
		});

		if (responseContacts.status >= 400 && responseContacts.status < 500) {
			const jsonResponse = await response.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		}

		if (responseContacts.ok) {
			const jsonResponse = await responseContacts.json();

			dataHolderContact = {
				data: jsonResponse.data.data,
				columns: ['id', 'firstName', 'lastName', 'email', 'messenger', 'phone', 'comments'],
				notOrderedColumns: []
			};
			metaContact = jsonResponse.data.meta;
			columns = jsonResponse.columns;

			console.log(optionsContacts)
			console.log(dataHolderContact)
		}
	}

	let hidden5 = false;
  	let transitionParams = {
		x: -320,
		duration: 200,
		easing: sineIn
  	};


	interface WithId {
		id: number;
	}

	function hasId<T>(item: T): item is T & WithId {
		return (item as WithId).id !== undefined;
	}


	async function addContactFromRecommended() {
		const subContact = {
			first_name: selectedData.firstName,
			last_name: selectedData.lastName,
			email: selectedData.email,
			phone: selectedData.phone,
			messenger: selectedData.messenger,
			comments: selectedData.comment,
			instruments: selectedData.instruments,
			recommendation_pending: true,
			validated: false,
		};

		let response = await fetch('/api/contacts/', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(subContact)
		});

		const requestHandler = new ResponseHandlerClient();

		requestHandler.handle(response, async () => {
			//pour quand le mailing fonctionnera
			sendRecommendedNotifications((await response.json()).id)

			//delet automatique de la recommendation lors de la creation d'un nouveau contact
			//deleteRecommended()
			goto(`/contacts/${(await response.json()).id}`);
		});
	}

	async function deleteRecommended() {
		let responseDelete = await fetch(`/api/recommended/${selectedData.id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		const requestHandlerDelete = new ResponseHandlerClient();

		requestHandlerDelete.handle(responseDelete, () => {
			window.location.reload();
		});		
	}


	async function sendRecommendedNotifications(id: number) {
		const data = {
    		projectId: Number($page.params.id),
    		recommendedId: id
		}
		console.log(data)

		const resMail = await fetch('/api/mailing/sendRecommendedNotifications', {
            method: 'POST',
            headers: {
            	'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
		if (resMail.ok) {
				alert('Mail successfully sent');
			} else if (resMail.status === 400) {
				const errorData = await resMail.json();
				alert(`Error: ${errorData.message}`);
			} else if (resMail.status === 500) {
				alert('Internal server error, please try again later');
			} else {
				alert('Unknown error occurred, please try again');
			}
	}

	async function sendParticipationValidationNotification(id: number) {
		console.log('send participaiton validation notification')
		const data = {
    		projectId: Number($page.params.id),
    		contactId: id
		}

		console.log('data sent to mail for participation validation blablablabla', data)
		const resMail = await fetch('/api/mailing/sendParticipationValidationNotifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
		if (resMail.ok) {
				alert('Mail successfully sent');
			} else if (resMail.status === 400) {
				const errorData = await resMail.json();
				alert(`Error: ${errorData.message}`);
			} else if (resMail.status === 500) {
				alert('Internal server error, please try again later');
			} else {
				alert('Unknown error occurred, please try again');
			}
	}

</script>



<Button class="focus:outline-none text-white bg-yellow-400 hover:bg-yellow-500 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:focus:ring-yellow-900" on:click={() => (hidden5 = false)}>search options</Button>

<Drawer class="absolute z-10 w-1/3" placement="left" transitionType="fly" {transitionParams} bind:hidden={hidden5} id="sidebar5">
	<div class="flex items-center">
		<h5 id="drawer-label" class="inline-flex items-center mb-4 text-base font-semibold text-gray-500 dark:text-gray-400">
			search options
		</h5>
		<CloseButton on:click={() => (hidden5 = true)} class="mb-4  dark:text-black" />
	</div>

	{#if dataHolderRecommended}
		<SimpleFilterer
			showData={true}
			paginatorTop={false}
			bind:data={dataHolderRecommended}
			bind:meta
			bind:options
			bind:uniqueUrl
			on:optionsUpdated={() => fetchData()}
			buttonLinkId={false}
			bind:selectedData
		></SimpleFilterer>
	{/if}

</Drawer>

<div class="flex">
	<div class="w-1/2">
		<form class="w-[40rem] mx-auto p-4">
			<div class="block mb-2 text-sm font-bold text-gray-900 dark:text-white">Recommandation :</div>

			<div class="grid md:grid-cols-2 md:gap-6">
				<div class="max-w-sm mx-auto">
					<label for="firstName" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">*First name</label>
					<div class="flex">
						<span class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-e-0 border-gray-300 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
							<Fa icon={faCircleUser} />
						</span>
						<input type="text" id="firstName" class="rounded-none rounded-e-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" bind:value={selectedData.firstName} placeholder="Bonnie" required />
					</div>
				</div>
			

				<div class="max-w-sm mx-auto">
					<label for="lastName" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">*Last name</label>
					<div class="flex">
						<input type="text" id="lastName" class="rounded-none rounded-e-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" bind:value={selectedData.lastName} placeholder="Green" required />
					</div>
				</div>
			</div>
			

			<div class="max-w-md mx-auto p-4">
				<label for="Email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
				<div class="flex">
					<span class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-e-0 border-gray-300 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
						<Fa icon={faEnvelope} />
					</span>
					<input type="text" id="Email" class="rounded-none rounded-e-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" bind:value={selectedData.email} placeholder="bonnie.green@company.com">
				</div>
			</div>
		
			<div class="max-w-md mx-auto p-4">
				<label for="Phone-number" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Phone number</label>
				<div class="flex">
					<span class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-e-0 border-gray-300 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
						<Fa icon={faPhone} />
					</span>
					<input type="tel" id="Phone-number" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" class="rounded-none rounded-e-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" bind:value={selectedData.phone} placeholder="Phone number (123-456-7890)">   
				</div>
			</div>

			<div class="max-w-md mx-auto p-4">
				<label for="Messenger handle" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Messenger handle</label>
				<div class="flex">
					<span class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-e-0 border-gray-300 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
						<Fa icon={faComment} />
					</span>
					<input type="text" id="Messager" class="rounded-none rounded-e-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" bind:value={selectedData.messenger} placeholder="Messenger handle">   
				</div>
			</div>

			
			<div>
				<div class="w-[16mv] mb-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
					<div class="px-4 py-2 bg-white rounded-t-lg dark:bg-gray-800">
						<label for="comment" class="sr-only">Your comment</label>
						<textarea bind:value={selectedData.comment} id="comment" rows="4" class="w-full px-0 text-sm text-gray-900 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-white dark:placeholder-gray-400" placeholder="Write a comment..."></textarea>
					</div>
				</div>
			</div>



			<!--ajout des instruments-->
			<div class="max-w-[40rem] mx-auto">
				<h3 class="w-full text-center m-1">Instruments</h3>

				<table
					class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 border"
				>
					<tbody>
						{#each selectedData.instruments as instrument}
							<tr class="even:bg-slate-200">
								<th>
									{instrument.name}
								</th>
								<th>
									{instrument.family}
								</th>
								<th>
									{instrument.pivot_proficiency_level}
								</th>
								
							</tr>
						{/each}
						
					</tbody>
				</table>
			</div>
		</form>
		<button on:click={addContactFromRecommended} type="button" class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">Create a new contact from the recommendation</button>
		<button on:click={deleteRecommended} type="button" class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">Delete the recommendation</button>

	</div>
	<div class="flex flex-col w-1/2">
		<div>
			<ContactModifier mode="modify" {contact} {instruments} />
		</div>

		{#if contact.id != null}
			<button on:click={() => sendParticipationValidationNotification(contact.id)} type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Send a email of participation for the project</button>
		{/if}


		<div>
			<button on:click={() => fetchData()} type="button" class="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900">Update the list</button>

			{#if dataHolderContact}
				<div class="grid grid-cols-1 w-full mt-2">
					<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
						<thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
							<tr>
								{#each dataHolderContact.columns as column}
									<th>
										{column}
									</th>
								{/each}
								{#if dataHolderContact.data.length > 0}
									{#if hasId(dataHolderContact.data[0])}
										<th> Actions </th>
									{/if}
								{/if}
							</tr>
						</thead>
						<tbody>
							{#each dataHolderContact.data as row}
								<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
									{#each dataHolderContact.columns as column}
										{#if typeof row[column] === 'object' && row[column] instanceof Date}
											<td>
												<DateShow date={row[column]} />
											</td>
										{:else}
											<td>{row[column]}</td>
										{/if}
									{/each}
									{#each dataHolderContact.notOrderedColumns as column}
										<td>{row[column]}</td>
									{/each}
									<td>
										{#if hasId(row)}
											<button
												on:click={() => {
													contact = row;
												}}
												class="text-blue-700 hover:text-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:text-blue-500 dark:hover:text-blue-600 dark:focus:ring-blue-800"
											>
												<span class="icon-[formkit--arrowright] hover:text-black"></span>
											</button>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>