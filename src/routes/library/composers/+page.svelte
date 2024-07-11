<script lang="ts">
	import { onMount } from 'svelte';

	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { Composer } from '$lib/types/Composer';

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

			console.log(data);

			composers = data

            meta = data.meta;

			dataHolder = {
				data: composers,
				columns: ['id', 'longName'],
				notOrderedColumns: []
			};

			selectedData = composers[0];
			
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
        	<span>selectionner un composer</span>
		{:else}
			<!--affichage des composers-->
			<div class="flex flex-col w-1/2 border-2 border-rose-500">
				<div class="flex justify-center border-2 border-rose-500">composer</div>
				<div class="flex flex-col p-2">
					<span>Full Name</span>
					<input
						class="p-1"
						bind:value={selectedData.longName}
						placeholder="enter the full name"
					/>
					<span>Short name</span>
					<input
						class="p-1"
						bind:value={selectedData.shortName}
						placeholder="enter the short name"
					/>
					<span>His main style</span>
					<input
						class="p-1"
						bind:value={selectedData.mainStyle}
						placeholder="enter his main style"
					/>
					<span>Country</span>
					<input class="p-1" bind:value={selectedData.country} placeholder="enter his country" />
					<span>Date of birth</span>
					<input
						id="birthDate"
						class="p-1"
						bind:value={selectedData.birthDate}
						placeholder="enter his date of birth"
						type="date"
					/>
					<span>Date of death</span>
					<input
						id="deathDate"
						class="p-1"
						bind:value={selectedData.deathDate}
						placeholder="enter his date of death"
						type="date"
					/>
				</div>

				<div class="flex p-2">
					{#if selectedData.id == null}
						<button class="p-1 border-2 border-green-500" on:click={addComposer}> add </button>
					{:else}
						<button class="p-1 border-2 border-orange-500" on:click={addComposer}> modify </button>
						<button class="p-1 border-2 border-red-500" on:click={deleteComposer}> Delete </button>
					{/if}
				</div>
			</div>
		{/if}
    </div>
</div>