<script lang="ts">
	import { onMount } from 'svelte';

	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { TypeOfPiece } from '$lib/types/TypeOfPiece';

	let selectedData: TypeOfPiece;

    let typeOfPiece: TypeOfPiece[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 1000000000,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};
	let url: string = '/api/type_of_pieces';
	let urlFront: string = '/library/type_of_pieces';
	let uniqueUrl: string = '/library/type_of_pieces';

	let dataHolder: TableData<TypeOfPiece>;

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

			typeOfPiece = data

            meta = data.meta;

			dataHolder = {
				data: typeOfPiece,
				columns: ['id', 'name'],
				notOrderedColumns: []
			};

			selectedData = typeOfPiece[0];
			
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

	//api type of piece
	async function addTypeOfPiece() {
		const name = selectedData.name;
		let response = await fetch('/api/type_of_pieces/', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name
			})
		});

		errorEvent(response);

		if (response.ok) {
			window.location.reload();
		}
	}

	async function deleteTypeOfPiece() {
		const validated = confirm('Are you sure you want to delete this file ?');

		if (!validated) return;

		let response = await fetch('/api/type_of_pieces/', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id: selectedData.id })
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



	<div class="justify-center w-1/2">
		<div class="flex flex-col w-1/4 p-2 justify-center border-2 border-red-500">
			{#if selectedData}
				<div class="flex border-2 border-rose-500">Type of Piece</div>

				<span>Name</span>
				<input
					class="p-1"
					bind:value={selectedData.name}
					placeholder="enter the name of the Type of Piece"
				/>

				<div class="flex p-2">
					{#if selectedData.id == null}
						<button class="p-1 border-2 border-green-500" on:click={addTypeOfPiece}> add </button>
					{:else}
						<button class="p-1 border-2 border-orange-500" on:click={addTypeOfPiece}> modify </button>
						<button class="p-1 border-2 border-red-500" on:click={deleteTypeOfPiece}> Delete </button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>