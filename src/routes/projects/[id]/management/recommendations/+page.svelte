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
        project_id: null,
        createdAt: null,
        updatedAt: null,
    };

	let meta: any = {};
	let options: any = {
		filter: $page.params.id.toString(),
		limit: 1000000000,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};
	let url: string = '/api/recommended';
	let urlFront: string = '/projects/' + $page.params.id + '/management/recommendations';
	let uniqueUrl: string = '/projects/' + $page.params.id + '/management/recommendations';

	let dataHolder: TableData<Recommended>;

	let contacts: Contact[] = []

	const contact: Contact = {
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
			filter: urlParams.get('filter') || $page.params.id.toString(),
			limit: parseInt(urlParams.get('limit') || '1000000000'),
			page: parseInt(urlParams.get('page') || '1'),
			order: urlParams.get('order') || 'asc',
			orderBy: urlParams.get('orderBy') || 'id'
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

			dataHolder = {
				data: recommended,
				columns: ['id', 'firstName', 'lastName'],
				notOrderedColumns: []
			};
		});


		const responseContacts = await fetch(`${url}${optionInUrls}`, {
			method: 'GET'
		});

		const responseHandlerContacts = new ResponseHandlerClient();

		responseHandlerContacts.handle(responseContacts, async () => {
			const data = await responseContacts.json();

			contacts = data.data

            meta = data.meta;

			dataHolder = {
				data: recommended,
				columns: ['id', 'firstName', 'lastName'],
				notOrderedColumns: []
			};
		});

	}

	async function errorEvent(response: Response) {
		if (response.status >= 400 && response.status < 500) {
			const jsonResponse = await response.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		} else if (response.status >= 500) {
			alert('Server error');
		}
	}

	let hidden5 = false;
  	let transitionParams = {
		x: -320,
		duration: 200,
		easing: sineIn
  	};

</script>



<Button class="focus:outline-none text-white bg-yellow-400 hover:bg-yellow-500 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:focus:ring-yellow-900" on:click={() => (hidden5 = false)}>search options</Button>

<Drawer class="absolute z-10 w-1/3" placement="left" transitionType="fly" {transitionParams} bind:hidden={hidden5} id="sidebar5">
	<div class="flex items-center">
		<h5 id="drawer-label" class="inline-flex items-center mb-4 text-base font-semibold text-gray-500 dark:text-gray-400">
			search options
		</h5>
		<CloseButton on:click={() => (hidden5 = true)} class="mb-4  dark:text-black" />
	</div>

	{#if dataHolder}
		<SimpleFilterer
			showData={true}
			paginatorTop={false}
			bind:data={dataHolder}
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
					<input type="text" id="Email" class="rounded-none rounded-e-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" bind:value={selectedData.email} placeholder="bonnie.Green@company.com">
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
				<div class="w-full mb-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
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
	</div>
	<div class="flex w-1/2">
		<ContactModifier mode="modify" {contact} {instruments} />
	</div>
</div>