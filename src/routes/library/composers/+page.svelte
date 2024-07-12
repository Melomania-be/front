<script lang="ts">
	import { onMount } from 'svelte';

	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { Composer } from '$lib/types/Composer';
	import DateShow from '$lib/components/DateShow.svelte';

	import Fa from 'svelte-fa';
	import { faGlobe, faTextSlash } from '@fortawesome/free-solid-svg-icons';

	let selectedData: Composer;

    let composers: Composer[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 1000000000,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};
	let url: string = '/api/composers';
	let urlFront: string = '/library/composers';
	let uniqueUrl: string = '/library/composers';

	let dataHolder: TableData<Composer>;

    onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);
		options = {
			filter: urlParams.get('filter') || '',
			limit: parseInt(urlParams.get('limit') || '1000000000'),
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
			
			composers = data

            meta = data.meta;

			dataHolder = {
				data: composers,
				columns: ['id', 'longName'],
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

	//api composer
	async function addComposer() {
		if (selectedData.birthDate === null || selectedData.deathDate === null) {
			return alert('Please enter a date of birth and a date of death');
		}

		const data = {
			id: selectedData.id ? selectedData.id : undefined,
			long_name: selectedData.longName,
			short_name: selectedData.shortName,
			main_style: selectedData.mainStyle,
			country: selectedData.country,
			birth_date: (await new Date(selectedData.birthDate))?.getTime(),
			death_date: (await new Date(selectedData.deathDate))?.getTime()
		};

		const response = await fetch('/api/composers/', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});

		errorEvent(response);

		if (response.ok) {
			window.location.reload();
		}
	}

	async function deleteComposer() {
		const validated = confirm('Are you sure you want to delete this file ?');

		if (!validated) return;

		const jsoned = JSON.stringify({ id: selectedData.id });

		const response = await fetch('/api/composers/', {
			method: 'DELETE',
			body: jsoned
		});

		errorEvent(response);

		if (response.ok) {
			window.location.reload();
		}
	}

</script>

<div class="flex">
    <div class="w-1/2">
        {#if dataHolder}
            <SimpleFilterer
                showData={true}
                bind:data={dataHolder}
                bind:meta
                bind:options
                bind:uniqueUrl
                on:optionsUpdated={() => fetchData()}
				buttonLinkId={false}
				bind:selectedData
            ></SimpleFilterer>
        {/if}
    </div>


	<!--affichage du composer selectionné-->
    <div class="w-1/2">
		{#if selectedData == null}
			<h1 class="text-4xl font-extrabold dark:text-white">Select a Composer</h1>
		{:else}
			<h1 class="text-4xl font-extrabold dark:text-white">Composer</h1>

			<label for="website-admin" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Full Name</label>
			<div class="flex">
				<span class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border rounded-e-0 border-gray-300 border-e-0 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
					<svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
						<path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z"/>
					</svg>
				</span>
				<input bind:value={selectedData.longName} type="text" id="website-admin" class="rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
			</div>
			
			<label for="website-admin" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Short name</label>
			<div class="flex">
				<span class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border rounded-e-0 border-gray-300 border-e-0 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
					<svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
						<path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z"/>
					</svg>
				</span>
				<input bind:value={selectedData.shortName} type="text" id="website-admin" class="rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
			</div>

			<label for="website-admin" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">main style</label>
			<div class="flex">
				<span class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border rounded-e-0 border-gray-300 border-e-0 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
					<svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
						<Fa icon={faTextSlash} />
					</svg>
				</span>
				<input bind:value={selectedData.mainStyle} type="text" id="website-admin" class="rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
			</div>

			<label for="website-admin" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Country</label>
			<div class="flex">
				<span class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border rounded-e-0 border-gray-300 border-e-0 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
					<svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
						<Fa icon={faGlobe} />
					</svg>
				</span>
				<input bind:value={selectedData.country} type="text" id="website-admin" class="rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
			</div>

			<div class="flex">
				<div class="flex flex-col">
					<label for="website-admin" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Date of birth</label>
					<div class="flex">
						<input bind:value={selectedData.birthDate} type="date" id="website-admin" class="rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
					</div>
				</div>

				<div class="flex flex-col">
					<label for="website-admin" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Date of death</label>
					<div class="flex">
						<input bind:value={selectedData.deathDate} type="date" id="website-admin" class="rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
					</div>
				</div>
			</div>
			<div class="flex p-2">
				{#if selectedData.id == 0}
					<button on:click={addComposer} type="button" class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">Add</button>
				{:else}
					<button on:click={addComposer} type="button" class="focus:outline-none text-white bg-yellow-400 hover:bg-yellow-500 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:focus:ring-yellow-900">modify</button>
					<button on:click={deleteComposer} type="button" class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">Delete</button>
				{/if}
			</div>
		{/if}
    </div>
</div>